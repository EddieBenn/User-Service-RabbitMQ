import {
  BadRequestException,
  ForbiddenException,
  HttpException,
  HttpStatus,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { CreateUserDto, IUser, UserFilter } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Users } from './entities/user.entity';
import { Repository, UpdateResult } from 'typeorm';
import { ForgotPasswordDto, IReqUser, LoginDto, Role } from 'src/base.entity';
import { UtilService } from 'src/utils/utility-service';
import { Transactional } from 'typeorm-transactional';
import { buildUserFilter } from 'src/filters/query-filter';
import { Response } from 'express';
import { AuthService } from 'src/auth/auth.service';
import { config } from 'src/config';
import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(Users)
    private readonly usersRepository: Repository<Users>,
    private readonly amqpConnection: AmqpConnection,
    private readonly authService: AuthService,
  ) {}

  @Transactional()
  async createUser(data: CreateUserDto, user: IReqUser): Promise<IUser> {
    const { email, role, password } = data;

    const emailExist = await this.usersRepository.exists({ where: { email } });
    if (emailExist) {
      throw new HttpException(
        `user with email: ${email} already exist`,
        HttpStatus.UNPROCESSABLE_ENTITY,
      );
    }

    if (role === Role.ADMIN && user.role !== Role.ADMIN) {
      throw new ForbiddenException(
        `You do not have permission to create an admin. Only admins can create other admins.`,
      );
    }

    const otp = UtilService.generateOTP();
    const [hashedPassword, hashedOTP] = await Promise.all([
      UtilService.hashPassword(password),
      UtilService.hashPassword(otp),
    ]);

    const newUser: IUser = {
      ...data,
      role: role ? role : Role.USER,
      password: hashedPassword,
      is_verified: false,
      otp: hashedOTP,
      otp_expiry: UtilService.generateOTPExpiration(),
    };
    const createdUser = await this.usersRepository.save(newUser);

    await this.amqpConnection.publish(
      config.RABBITMQ_EXCHANGE,
      config.SIGNUP_ROUTING_KEY,
      {
        email: createdUser.email,
        first_name: createdUser.first_name,
        otp: otp,
        otp_expiry: createdUser.otp_expiry,
      },
    );

    return createdUser;
  }

  @Transactional()
  async verifyOTP(email: string, otp: string): Promise<UpdateResult> {
    const user = await this.usersRepository.findOne({
      where: { email },
    });

    if (!user?.id) {
      throw new NotFoundException(`User with email: ${email} not found`);
    }

    if (user.is_verified) {
      throw new BadRequestException('User is already verified');
    }

    if (!user?.otp || !user?.otp_expiry) {
      throw new BadRequestException('No OTP found for this user');
    }

    const now = new Date();
    const otpExpiry = new Date(user.otp_expiry);

    if (now > otpExpiry) {
      throw new BadRequestException('OTP has expired');
    }

    const isValidOTP = await UtilService.validateOTP(otp, user.otp);
    if (!isValidOTP) {
      throw new UnauthorizedException('Invalid OTP');
    }

    const verifiedUser = await this.usersRepository.update(user.id, {
      is_verified: true,
      otp: null,
      otp_expiry: null,
    });

    await this.amqpConnection.publish(
      config.RABBITMQ_EXCHANGE,
      config.VERIFIED_ROUTING_KEY,
      {
        email: user.email,
        first_name: user.first_name,
      },
    );

    return verifiedUser;
  }

  @Transactional()
  async resendOTP(email: string): Promise<{ message: string }> {
    const user = await this.usersRepository.findOne({
      where: { email },
    });

    if (!user?.id) {
      throw new NotFoundException(`User with email: ${email} not found`);
    }

    if (user.is_verified) {
      throw new BadRequestException('User is already verified');
    }

    const otp = UtilService.generateOTP();
    const hashedOTP = await UtilService.hashPassword(otp);
    await this.usersRepository.update(user.id, {
      otp: hashedOTP,
      otp_expiry: UtilService.generateOTPExpiration(),
    });

    await this.amqpConnection.publish(
      config.RABBITMQ_EXCHANGE,
      config.SIGNUP_ROUTING_KEY,
      {
        email: user.email,
        first_name: user.first_name,
        otp: otp,
        otp_expiry: UtilService.generateOTPExpiration(),
      },
    );

    return {
      message: `A new otp successfully sent to: ${user.email}`,
    };
  }

  @Transactional()
  async getAllUsers(queryParams: UserFilter) {
    const page = queryParams?.page
      ? Number(queryParams?.page)
      : config.DEFAULT_PAGE_NO;
    const size = queryParams?.size
      ? Number(queryParams.size)
      : config.DEFAULT_PER_PAGE;
    const skip = (page - 1) * size;

    const query = await buildUserFilter(queryParams);
    const [users, count] = await this.usersRepository.findAndCount({
      where: query,
      skip,
      take: size,
      order: { created_at: 'DESC' },
    });

    const totalPages = Math.ceil(count / size);
    return {
      users,
      pagination: {
        totalRows: count,
        perPage: size,
        currentPage: page,
        totalPages,
        hasNextPage: page < totalPages,
      },
    };
  }

  async getUserById(id: string): Promise<Users> {
    const user = await this.usersRepository.findOne({ where: { id } });
    if (!user?.id) {
      throw new HttpException(
        `user with id: ${id} not found`,
        HttpStatus.NOT_FOUND,
      );
    }
    return user;
  }

  @Transactional()
  async updateUserById(id: string, data: UpdateUserDto) {
    return this.usersRepository.update(id, data);
  }

  @Transactional()
  async loginUser(data: LoginDto, res: Response) {
    const { email, password } = data;

    const user = await this.usersRepository.findOne({
      where: { email },
    });
    if (!user?.id) {
      throw new NotFoundException(`user with email: ${data.email} not found`);
    }

    const isPasswordValid = await UtilService.validatePassword(
      password,
      user?.password,
    );
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid password');
    }

    const tokenData = {
      id: user.id,
      first_name: user.first_name,
      last_name: user.last_name,
      email: user.email,
      phone: user.phone,
      city: user.city,
      role: user.role,
    };

    const access_token = await this.authService.generateToken(tokenData);

    // Set the token in a cookie
    res.cookie('access_token', access_token, {
      httpOnly: true, // Cookie is not accessible via JavaScript
      secure: config.NODE_ENV === 'production', // Set to true in production for HTTPS
      expires: UtilService.generateCookieExpiration(),
      sameSite: 'strict',
    });

    return res.status(HttpStatus.OK).json({
      user,
      access_token,
      expires_at: UtilService.generateTokenExpiration(),
    });
  }

  @Transactional()
  async resetPassword(data: ForgotPasswordDto, res: Response) {
    const { email, password } = data;

    const user = await this.usersRepository.findOne({
      where: { email },
    });
    if (!user?.id) {
      throw new HttpException(
        `user with email: ${email} not found`,
        HttpStatus.NOT_FOUND,
      );
    }

    const isSamePassword = await UtilService.validatePassword(
      password,
      user.password,
    );
    if (isSamePassword) {
      throw new BadRequestException(
        'New password cannot be the same as your old password',
      );
    }

    const hashedPassword = await UtilService.hashPassword(password);
    await this.usersRepository.update(
      { email: email },
      { password: hashedPassword },
    );
    return res.status(HttpStatus.OK).json({
      message: 'User password reset successful',
    });
  }

  async logoutUser(res: Response) {
    res.clearCookie('access_token', {
      httpOnly: true,
      secure: config.NODE_ENV === 'production',
      sameSite: 'strict',
    });

    return res.status(HttpStatus.OK).json({
      message: 'Logout successful',
    });
  }

  async deleteUserById(id: string) {
    return this.usersRepository.delete(id);
  }
}

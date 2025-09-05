import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { IReqUser } from 'src/base.entity';
import { config } from 'src/config';

@Injectable()
export class AuthService {
  constructor(private jwtService: JwtService) {}

  async generateToken(user: IReqUser): Promise<string> {
    const payload = { ...user, sub: user.id };
    const token = await this.jwtService.signAsync(payload, {
      secret: config.JWT_SECRET,
      issuer: 'User-Service-RabbitMQ',
      expiresIn: config.JWT_EXPIRY,
    });
    return token;
  }
}

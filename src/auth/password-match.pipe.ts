import {
  PipeTransform,
  Injectable,
  ArgumentMetadata,
  BadRequestException,
} from '@nestjs/common';

@Injectable()
export class PasswordMatch implements PipeTransform {
  transform(value: any, metadata: ArgumentMetadata) {
    const { password, confirm_password } = value;

    if (password !== confirm_password) {
      throw new BadRequestException('Passwords do not match');
    }

    return value;
  }
}

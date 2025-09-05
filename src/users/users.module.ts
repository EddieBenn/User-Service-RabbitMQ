import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Users } from './entities/user.entity';
import { RabbitMQModule } from '@golevelup/nestjs-rabbitmq';
import { config } from 'src/config';
import { AuthModule } from 'src/auth/auth.module';
import { UserSubscriber } from './subscribers/user.subsriber';

@Module({
  imports: [
    TypeOrmModule.forFeature([Users]),
    RabbitMQModule.forRoot({
      uri: config.RABBITMQ_URL,
      exchanges: [
        {
          name: config.RABBITMQ_EXCHANGE,
          type: 'direct',
        },
      ],
      connectionInitOptions: { wait: true, timeout: 5000 },
    }),
    AuthModule,
  ],
  controllers: [UsersController],
  providers: [UsersService, UserSubscriber],
  exports: [UsersService],
})
export class UsersModule {}

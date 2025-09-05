import {
  EntitySubscriberInterface,
  EventSubscriber,
  InsertEvent,
  UpdateEvent,
  DataSource,
  Not,
} from 'typeorm';
import { Users } from '../entities/user.entity';
import { HttpException, HttpStatus } from '@nestjs/common';

@EventSubscriber()
export class UserSubscriber implements EntitySubscriberInterface<Users> {
  constructor(dataSource: DataSource) {
    dataSource.subscribers.push(this);
  }

  listenTo() {
    return Users;
  }

  async beforeInsert(event: InsertEvent<Users>): Promise<void> {
    const user = event.entity;
    const repository = event.manager.getRepository(Users);

    const existingPhone = await repository.exists({
      where: { phone: user.phone },
    });

    if (existingPhone) {
      throw new HttpException(
        `User with phone number '${user.phone}' already exists!`,
        HttpStatus.UNPROCESSABLE_ENTITY,
      );
    }
  }

  async beforeUpdate(event: UpdateEvent<Users>): Promise<void> {
    if (!event.entity) return;

    const repository = event.manager.getRepository(Users);
    const user = event.entity as Users;

    // Only check if email is being updated
    if (user?.email && user?.id) {
      const existingEmail = await repository.exists({
        where: {
          id: Not(user.id),
          email: user.email,
        },
      });
      if (existingEmail) {
        throw new HttpException(
          `User with email '${user.email}' already exists!`,
          HttpStatus.UNPROCESSABLE_ENTITY,
        );
      }
    }

    // Only check if phone is being updated
    if (user?.phone && user?.id) {
      const existingPhone = await repository.exists({
        where: {
          id: Not(user.id),
          phone: user.phone,
        },
      });
      if (existingPhone) {
        throw new HttpException(
          `User with phone '${user.phone}' already exists!`,
          HttpStatus.UNPROCESSABLE_ENTITY,
        );
      }
    }
  }
}

import { BeforeInsert, Column, Entity, Unique } from 'typeorm';
import { BaseEntity, Role } from '../../base.entity';
import { GenderEnum } from '../dto/create-user.dto';

@Unique(['email'])
@Unique(['phone'])
@Entity({ name: 'users' })
export class Users extends BaseEntity {
  @BeforeInsert()
  fieldsToModify() {
    this.city = this.city.toLowerCase();
    this.gender = this.gender.toLowerCase();
  }
  @Column({ nullable: false, type: 'varchar' })
  first_name: string;

  @Column({ nullable: false, type: 'varchar' })
  last_name: string;

  @Column({ nullable: false, type: 'varchar' })
  email: string;

  @Column({ nullable: false, type: 'varchar' })
  phone: string;

  @Column({ nullable: false, type: 'varchar' })
  password: string;

  @Column({ nullable: false, type: 'varchar' })
  city: string;

  @Column({ nullable: true, type: 'varchar' })
  otp?: string | null;

  @Column({ nullable: true, type: 'timestamp' })
  otp_expiry?: Date | string | null;

  @Column({
    nullable: false,
    type: 'varchar',
    enum: [GenderEnum.MALE, GenderEnum.FEMALE],
  })
  gender: string;

  @Column({
    nullable: false,
    type: 'varchar',
    enum: [Role.USER, Role.ADMIN],
    default: Role.USER,
  })
  role: string;

  @Column({ nullable: false, type: 'boolean', default: false })
  is_verified: boolean;
}

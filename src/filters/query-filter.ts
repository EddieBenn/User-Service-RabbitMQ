import { HttpException, HttpStatus } from '@nestjs/common';
import { UserFilter } from 'src/users/dto/create-user.dto';
import { Between, ILike } from 'typeorm';

export const buildUserFilter = async (queryParams: UserFilter) => {
  const query = {};

  if (queryParams?.city) query['city'] = ILike(queryParams.city);
  if (queryParams?.email) query['email'] = queryParams.email.toLowerCase();
  if (queryParams?.phone) query['phone'] = queryParams.phone;
  if (queryParams?.gender) query['gender'] = queryParams.gender.toLowerCase();
  if (queryParams?.role) query['role'] = queryParams.role.toLowerCase();
  if (queryParams?.first_name)
    query['first_name'] = ILike(queryParams.first_name);
  if (queryParams?.last_name) query['last_name'] = ILike(queryParams.last_name);

  if (queryParams?.start_date && queryParams?.end_date) {
    const regex = /^\d{4}-\d{2}-\d{2}$/;
    if (!regex.test(queryParams?.start_date)) {
      throw new HttpException(
        `use date format yy-mm-dd`,
        HttpStatus.NOT_ACCEPTABLE,
      );
    }
    query['created_at'] = Between(
      new Date(queryParams.start_date),
      new Date(queryParams.end_date),
    );
  }
  return query;
};

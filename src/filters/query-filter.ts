// import { HttpException, HttpStatus } from '@nestjs/common';
// import { UserFilter } from 'src/users/dto/create-user.dto';

// export const buildUserFilter = async (queryParams: UserFilter) => {
//   const query: any = {};

//   if (queryParams?.first_name) {
//     query.first_name = {
//       contains: queryParams.first_name,
//       mode: 'insensitive',
//     };
//   }
//   if (queryParams?.last_name) {
//     query.last_name = { contains: queryParams.last_name, mode: 'insensitive' };
//   }
//   if (queryParams?.email) {
//     query.email = { equals: queryParams.email.toLowerCase() };
//   }

//   if (queryParams?.start_date && queryParams?.end_date) {
//     const regex = /^\d{4}-\d{2}-\d{2}$/;
//     if (!regex.test(queryParams?.start_date)) {
//       throw new HttpException(
//         `use date format yy-mm-dd`,
//         HttpStatus.NOT_ACCEPTABLE,
//       );
//     }
//     query.created_at = {
//       gte: new Date(queryParams.start_date),
//       lte: new Date(queryParams.end_date),
//     };
//   }
//   return query;
// };

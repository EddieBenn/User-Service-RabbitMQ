import { config } from 'src/config';
import { DataSource, DataSourceOptions } from 'typeorm';

export const postGresConfig: DataSourceOptions = {
  type: 'postgres',
  host: config.DB_HOST,
  port: config.DB_PORT,
  username: config.DB_USERNAME,
  password: config.DB_PASSWORD,
  database: config.DB_DATABASE,
  entities: ['dist/src/**/*.entity.js'],
  migrations: ['dist/src/migrations/*.js'],
  synchronize: true,
  logging: false,
  poolSize: 5,
  ssl: {
    rejectUnauthorized: false,
  },
};
const dataSource = new DataSource(postGresConfig);
export default dataSource;

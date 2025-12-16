# RabbitMQ User Service

[Project URL](https://user-service-rabbitmq.onrender.com) | [API Documentation](https://user-service-rabbitmq.onrender.com/documentationView)

## Project Overview
The RabbitMQ User Service is a comprehensive NestJS-based microservice designed to manage user authentication and account management with event-driven architecture. The platform features secure JWT-based authentication with role-based access control (Admin, User), OTP verification for new users, and integrated RabbitMQ messaging for asynchronous event processing. The system publishes events for user signup and verification that are consumed by a separate notification service, demonstrating event-driven microservices communication patterns.

## Features
- **Multi-Role Authentication**: Secure JWT-based authentication with role-based access control (Admin, User)
- **OTP Verification**: Two-factor authentication for new user registration with 15-minute expiration
- **Event-Driven Architecture**: RabbitMQ integration for publishing user events to notification service
- **User Management**: Complete CRUD operations with pagination and filtering
- **Password Management**: Secure password reset and validation with bcrypt hashing
- **Cookie-Based Sessions**: HTTPOnly cookies for enhanced security
- **API Documentation**: Interactive Swagger/OpenAPI documentation
- **Rate Limiting**: Protection against abuse (100 requests per 15 minutes)
- **Transaction Management**: Database transactions with typeorm-transactional
- **Comprehensive Validation**: Request validation with class-validator and class-transformer
- **Entity Subscribers**: Automated validation for unique constraints on phone and email
- **TypeORM Integration**: PostgreSQL database with SSL support for production

## Table of Contents
Installation<br />
Environment Variables<br />
Project Structure<br />
Event-Driven Architecture<br />
API Routes<br />
User Routes<br />
Technologies Used<br />
Testing<br />

## Installation
To install and run the project locally:

#### Clone the repository:

```bash
git clone https://github.com/EddieBenn/User-Service-RabbitMQ.git
```

#### Navigate into the project directory:

```bash
cd rabbitmq-user-service
```

#### Install dependencies:

```bash
npm install
```

#### Create a .env file in the root directory (see the Environment Variables section)

#### Build the project:

```bash
npm run build
```

#### Start the development server:

```bash
npm run start:dev
```

#### Start the production server:

```bash
npm run start:prod
```

## Environment Variables
Create a .env file in the root directory with the following variables:

```env
# SERVER
PORT=3000
NODE_ENV=development
APP_URL=http://localhost:

# JWT
JWT_SECRET=your-jwt-secret
JWT_EXPIRY=1h

# DATABASE
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=your-password
DB_DATABASE=your-database-name

# RABBITMQ
RABBITMQ_URL=amqp://localhost
RABBITMQ_EXCHANGE=user-events
SIGNUP_ROUTING_KEY=user.signup
VERIFIED_ROUTING_KEY=user.verified
```

## Project Structure

```
├── src
│   ├── auth
│   │   ├── dto
│   │   │   ├── create-auth.dto.ts
│   │   │   └── update-auth.dto.ts
│   │   ├── auth.controller.spec.ts
│   │   ├── auth.controller.ts
│   │   ├── auth.decorator.ts
│   │   ├── auth.guard.ts
│   │   ├── auth.module.ts
│   │   ├── auth.service.spec.ts
│   │   ├── auth.service.ts
│   │   ├── password-match.pipe.ts
│   │   ├── role.decorator.ts
│   │   └── role.guard.ts
│   ├── config
│   │   └── index.ts
│   ├── filters
│   │   ├── exception-filter.ts
│   │   └── query-filter.ts
│   ├── users
│   │   ├── dto
│   │   │   ├── create-user.dto.ts
│   │   │   ├── paginate.dto.ts
│   │   │   └── update-user.dto.ts
│   │   ├── entities
│   │   │   └── user.entity.ts
│   │   ├── subscribers
│   │   │   └── user.subscriber.ts
│   │   ├── users.controller.spec.ts
│   │   ├── users.controller.ts
│   │   ├── users.module.ts
│   │   ├── users.service.spec.ts
│   │   └── users.service.ts
│   ├── utils
│   │   └── utility-service.ts
│   ├── app.controller.spec.ts
│   ├── app.controller.ts
│   ├── app.module.ts
│   ├── app.service.ts
│   ├── base.entity.ts
│   └── main.ts
├── test
│   ├── app.e2e-spec.ts
│   └── jest-e2e.json
├── .env
├── .eslintrc.js
├── .gitignore
├── .prettierrc
├── eslint.config.mjs
├── nest-cli.json
├── ormconfig.ts
├── package.json
├── README.md
├── tsconfig.build.json
└── tsconfig.json
```

## Event-Driven Architecture

This service implements event-driven architecture using RabbitMQ to publish user-related events. A separate notification service listens to these events and handles email notifications asynchronously.

### Published Events

#### 1. User Signup Event
**Exchange**: `user-events` (direct)  
**Routing Key**: `user.signup`  
**Payload**:
```json
{
  "email": "user@example.com",
  "first_name": "John",
  "otp": "123456"
}
```
**Triggered When**: A new user is created  
**Consumer Action**: Notification service sends welcome email with OTP

#### 2. User Verified Event
**Exchange**: `user-events` (direct)  
**Routing Key**: `user.verified`  
**Payload**:
```json
{
  "email": "user@example.com",
  "first_name": "John"
}
```
**Triggered When**: User successfully verifies their OTP  
**Consumer Action**: Notification service sends verification confirmation email

#### 3. OTP Resend Event
**Exchange**: `user-events` (direct)  
**Routing Key**: `user.signup`  
**Payload**:
```json
{
  "email": "user@example.com",
  "first_name": "John",
  "otp": "654321"
}
```
**Triggered When**: User requests OTP resend  
**Consumer Action**: Notification service sends new OTP email

### RabbitMQ Configuration

The service uses [@golevelup/nestjs-rabbitmq](https://github.com/golevelup/nestjs/tree/master/packages/rabbitmq) for RabbitMQ integration:

- **Exchange Type**: Direct
- **Connection Timeout**: 5000ms
- **Connection Init**: Wait enabled
- **SSL**: Configurable via RABBITMQ_URL

## API Routes

#### User Routes

<table>
  <thead>
    <tr>
      <th>HTTP Method</th>
      <th>Endpoint</th>
      <th>Description</th>
      <th>Auth Required</th>
      <th>Event Published</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>POST</td>
      <td>/users</td>
      <td>Create a new user</td>
      <td>No</td>
      <td>user.signup</td>
    </tr>
    <tr>
      <td>POST</td>
      <td>/users/verify-otp</td>
      <td>Verify user OTP</td>
      <td>No</td>
      <td>user.verified</td>
    </tr>
    <tr>
      <td>POST</td>
      <td>/users/resend-otp</td>
      <td>Resend OTP to user</td>
      <td>No</td>
      <td>user.signup</td>
    </tr>
    <tr>
      <td>GET</td>
      <td>/users</td>
      <td>Get all users with pagination and filters</td>
      <td>Yes (Admin/User)</td>
      <td>None</td>
    </tr>
    <tr>
      <td>GET</td>
      <td>/users/:id</td>
      <td>Get user by ID</td>
      <td>Yes (Admin/User)</td>
      <td>None</td>
    </tr>
    <tr>
      <td>PUT</td>
      <td>/users/:id</td>
      <td>Update user details</td>
      <td>Yes (Admin/User)</td>
      <td>None</td>
    </tr>
    <tr>
      <td>POST</td>
      <td>/users/login</td>
      <td>User login</td>
      <td>No</td>
      <td>None</td>
    </tr>
    <tr>
      <td>POST</td>
      <td>/users/logout</td>
      <td>User logout</td>
      <td>No</td>
      <td>None</td>
    </tr>
    <tr>
      <td>POST</td>
      <td>/users/reset-password</td>
      <td>Reset user password</td>
      <td>No</td>
      <td>None</td>
    </tr>
    <tr>
      <td>DELETE</td>
      <td>/users/:id</td>
      <td>Delete user</td>
      <td>Yes (Admin only)</td>
      <td>None</td>
    </tr>
  </tbody>
</table>

### Query Parameters for GET /users

- `page`: Page number (default: 1)
- `size`: Items per page (default: 10)
- `city`: Filter by city
- `email`: Filter by email
- `phone`: Filter by phone
- `gender`: Filter by gender (male/female)
- `role`: Filter by role (user/admin)
- `first_name`: Filter by first name
- `last_name`: Filter by last name
- `start_date`: Filter by creation date (format: YYYY-MM-DD)
- `end_date`: Filter by creation date (format: YYYY-MM-DD)

## Technologies Used

<ul>
<li><strong>NestJS</strong> - Progressive Node.js framework</li>
<li><strong>TypeScript</strong> - Type-safe JavaScript</li>
<li><strong>TypeORM</strong> - ORM for TypeScript and JavaScript</li>
<li><strong>PostgreSQL</strong> - Relational database</li>
<li><strong>RabbitMQ</strong> - Message broker for event-driven architecture</li>
<li><strong>@golevelup/nestjs-rabbitmq</strong> - RabbitMQ integration for NestJS</li>
<li><strong>Passport JWT</strong> - JWT authentication strategy</li>
<li><strong>class-validator</strong> - Validation decorators</li>
<li><strong>class-transformer</strong> - Object transformation</li>
<li><strong>bcryptjs</strong> - Password hashing</li>
<li><strong>uuid</strong> - UUID generation</li>
<li><strong>moment</strong> - Date/time manipulation</li>
<li><strong>Swagger/OpenAPI</strong> - API documentation</li>
<li><strong>cookie-parser</strong> - Cookie parsing middleware</li>
<li><strong>express-rate-limit</strong> - Rate limiting</li>
<li><strong>typeorm-transactional</strong> - Transaction management</li>
<li><strong>Jest</strong> - Testing framework</li>
<li><strong>ESLint</strong> - Code linting</li>
<li><strong>Prettier</strong> - Code formatting</li>
</ul>

## Testing

```bash
# unit tests
npm run test

# e2e tests
npm run test:e2e

# test coverage
npm run test:cov
```

## Key Features Explained

### OTP Verification Flow
1. User registration triggers OTP generation and hashing
2. OTP is published to RabbitMQ (user.signup event)
3. Notification service consumes event and sends email
4. User verifies OTP within 15 minutes
5. Successful verification publishes user.verified event
6. Account is activated

### Entity Subscribers
The `UserSubscriber` automatically validates:
- Unique phone numbers on insert and update
- Unique emails on update (checked in service layer for inserts)
- Throws appropriate HTTP exceptions for conflicts

### Security Features
- HTTPOnly cookies for token storage
- Password hashing with bcrypt (10 salt rounds)
- JWT with configurable expiration
- Rate limiting (100 requests per 15 minutes)
- CORS enabled
- SSL support for production database

### Transaction Management
All database operations use TypeORM transactions via the `@Transactional()` decorator from typeorm-transactional to ensure data consistency.

## License

This project is MIT licensed.

import 'dotenv/config';
import App from './app';
import ValidationController from './controller/validation.controller';
import AdminUserController from './controller/admin.users.controller';
import UserController from './controller/users.controller';

const app = new App(
  [
    new ValidationController(),
    new AdminUserController(),
    new UserController(),
  ]
);
 
app.listen();
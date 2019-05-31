import 'dotenv/config';
import App from './app';
import ValidationController from './controller/validation.controller';
import AdminUserController from './controller/admin.users.controller';
import AdminProcessItemController from './controller/admin.process-item.controller';
import UserController from './controller/users.controller';
import UserProcessItemController from './controller/user.process-item.controller';

const app = new App(
  [
    new ValidationController(),
    new AdminUserController(),
    new AdminProcessItemController(),
    new UserController(),
    new UserProcessItemController(),
  ]
);
 
app.listen();
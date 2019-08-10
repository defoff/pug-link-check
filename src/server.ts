import 'dotenv/config';
import App from './app';
import AdminUserController from './controller/admin.users.controller';
import AdminProcessItemController from './controller/admin.process-item.controller';
import UserController from './controller/users.controller';
import UserProcessItemController from './controller/user.process-item.controller';
import AnonymousController from './controller/anonymous.controller';

const app = new App(
  [
    new AnonymousController(),
    new AdminUserController(),
    new AdminProcessItemController(),
    new UserController(),
    new UserProcessItemController(),
  ]
);
 
app.listen();
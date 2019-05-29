import 'dotenv/config';
import App from './app';
import ValidationController from './controller/validation.controller';

const app = new App(
  [
    new ValidationController()
  ]
);
 
app.listen();
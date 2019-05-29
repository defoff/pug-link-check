import * as bodyParser from 'body-parser';
import * as express from 'express';
import * as helmet from 'helmet';
import * as mongoose from 'mongoose';
import Controller from './interfaces/controller.interface';

class App {
  public app: express.Application;
 
  constructor(controllers: Controller[]) {
    this.app = express();
    this.connectToTheDatabase();
    this.initializeMiddlewares();
    this.initializeViewEngine();
    this.initializeControllers(controllers);
  }
 
  public listen() {
    this.app.listen(process.env.PORT, () => {
      console.log(`App listening on the port ${process.env.PORT}`);
    });
  }

  private initializeViewEngine() {
    this.app.set('view engine', 'pug');
    this.app.set('views', __dirname + '../../views');
  }
 
  private initializeMiddlewares() {
    this.app.use(express.static('public'));
    // flash messages require sessions 
    this.app.use(bodyParser.json());
    this.app.use(bodyParser.urlencoded({extended: false}));
    this.app.use(helmet());
  }

  private initializeControllers(controllers: Controller[]) {
    controllers.forEach((controller) => {
      this.app.use('/', controller.router);
    });
  }

  private connectToTheDatabase() {
    const {
      MONGO_USER,
      MONGO_PASSWORD,
      MONGO_PATH,
    } = process.env;
    mongoose.connect(`mongodb://${MONGO_PATH}`,{ useNewUrlParser: true, useFindAndModify: false }).then(() => {
      console.log('...server connected to database');
    });
  }
}
 
export default App;
import * as express from 'express';

class Server {
    public server: express.Application;
    constructor() {
        this.server = express();
        this.init();
        this.routes();
    }
    public init(): void {
        this.server.use(express.static('angular-dist'));
    }
    public routes(): void {
        /**
         * GET /dos: get all "dos"
         */
        this.server.get('/', (req, res) => {
            res.status(200).end();
        });
    }
}
export default new Server().server;
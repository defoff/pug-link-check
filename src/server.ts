import * as express from 'express';
import * as bodyParser from 'body-parser';
import * as request from 'request';
import * as cheerio from 'cheerio';
import * as URL from 'url-parse';
import { Validator } from './validator';
import * as helmet from 'helmet';

class Server {
    public server: express.Application;
    constructor() {
        this.server = express();
        this.init();
        this.routes();
    }
    public init(): void {
        // secure headers with helmet defaults
        this.server.use(helmet());
        // mount public folder for assets
        this.server.use(express.static('public'));
        // set view engine and template directory
        this.server.set('views', './views');
        this.server.set('view engine', 'pug');
        // configure top level body parser
        this.server.use(bodyParser.urlencoded({ extended: false }));
        
    }
    public routes(): void {

        this.server.get('/', (req, res) => {
            res.render('landing');
        });

        this.server.post('/validate', (req, res) => {
            let ltc = this.sanitizeString(req.body.linktocheck);
            let stc = this.sanitizeString(req.body.sitetocheck);
            let v = new Validator(ltc, stc);
            v.requestUrl().then((crawlerResult:any) => {
                res.render('landing', { 
                    pageTitle: crawlerResult.pageTitle,
                    hasLink: crawlerResult.hasLink,
                    links: crawlerResult.links
                });
            }).catch((err) => {
                res.render('landing');
            });
        });
    }
    public sanitizeString(str) {
        str = str.replace(/[^a-z0-9.:/,_-]/gim,"");
        return str.trim();
    }
}
export default new Server().server;
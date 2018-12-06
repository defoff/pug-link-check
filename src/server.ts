import * as express from 'express';
import * as bodyParser from 'body-parser';
import { Validator } from './validator';
import * as helmet from 'helmet';

import CheckProcessModel from './models/check-process';



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


        this.server.get('/create', (req, res) => {
            const check = new CheckProcessModel({
                siteToCheck: 'it',
                linkToCheck: 'works'
            });
            check.save().then((doc) => {
                console.log('saved CHECKPROCESSMODEL');
                res.send(doc);
            });

        });


        this.server.get('/', (req, res) => {
            CheckProcessModel.find({}, null, { limit: -5 }, (err, docs) => {
                console.log(docs);            
                res.render('landing', {
                    userLtc: true,
                    userStc: true,
                    lastQueries: docs
                });
            });

        });

        this.server.post('/validate', (req, res) => {
            let ltc = this.sanitizeString(req.body.linktocheck);
            let stc = this.sanitizeString(req.body.sitetocheck);
            let vali = new Validator(ltc, stc);
            vali.requestUrl().then((crawlerResult:any) => {
                res.render('landing', { 
                    error: false,
                    pageTitle: crawlerResult.pageTitle,
                    hasLink: crawlerResult.hasLink,
                    links: crawlerResult.links
                });
            }).catch((err) => {
                if (err.type === 'validation-error') {
                    console.log('validation-error');
                    res.render('landing', {
                        userLtc: err.userLtc,
                        userStc: err.userStc,
                        ltc: err.ltc,
                        stc: err.stc
                    });
                }
            });
        });
    }
    private sanitizeString(str) {
        str = str.replace(/[^a-z0-9.:/,_-]/gim,"");
        return str.trim();
    }
}
export default new Server().server;
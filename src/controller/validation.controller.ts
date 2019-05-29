import * as express from 'express';
import Controller from '../interfaces/controller.interface';
import CheckProcessModel from '../models/check-process.model';
import { Validator } from '../services/validation.service';

class ValidationController implements Controller {
    public path = '/';
    public router = express.Router();

    constructor() {
        this.initializeRoutes();
    }

    private initializeRoutes() {
        this.router.get('/create', (req, res) => {
            const check = new CheckProcessModel({
                siteToCheck: 'it',
                linkToCheck: 'works'
            });
            check.save().then((doc) => {
                console.log('saved CHECKPROCESSMODEL');
                res.send(doc);
            });

        });


        this.router.get('/', (req, res) => {
            CheckProcessModel.find({}, null, { limit: -5 }, (err, docs) => {
                console.log(docs);            
                res.render('landing', {
                    userLtc: true,
                    userStc: true,
                    lastQueries: docs
                });
            });

        });

        this.router.post('/validate', (req, res) => {
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

export default ValidationController;
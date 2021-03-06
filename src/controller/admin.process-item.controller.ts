import Controller from '../interfaces/controller.interface';
// load up the user model
import userModel from '../models/users.model';
import User from '../interfaces/user.interface';
// load up the process item model
import processItemModel from '../models/process-item.model';
import ProcessItem from '../interfaces/process-item.interface';
// load up interfaces
import ValidationStats from '../interfaces/validation.stats.interface';

// load up third party deps
import * as express from 'express';
import * as passport from 'passport';
import * as flash from 'connect-flash/lib';
import { body, validationResult } from 'express-validator/check';
import { sanitizeBody } from 'express-validator/filter';
import * as expressValidator from 'express-validator';
import * as randomstring from 'randomstring';
import { isLoggedIn, isLoggInAsAdmin } from '../guards/auth.guard';
import { Validator } from '../services/validation.service';
import { request } from 'http';


class AdminProcessItemController implements Controller {
    public path = '/admin/process-items';
    public router = express.Router();
    private users = userModel;
    private processItems = processItemModel;
    private validationErrors;

    constructor() {
        this.initializeRoutes();
    }

    private initializeRoutes() {
        this.router.get(`${this.path}`, isLoggInAsAdmin, this.renderArchiveProcessItems);
        this.router.post(`${this.path}`, isLoggInAsAdmin, this.renderArchiveProcessItems);
        this.router.get(`${this.path}/add`, isLoggInAsAdmin, this.renderAddProcessItemPage);
        this.router.post(`${this.path}/add`, isLoggInAsAdmin, this.sanitizationChain(),
            this.addProcessItem);
        this.router.get(`${this.path}/verify/:id`, isLoggInAsAdmin, this.verifyProcessItem);
        this.router.get(`${this.path}/reject/:id`, isLoggInAsAdmin, this.rejectProcessItem);
        this.router.get(`${this.path}/validate/:id`, isLoggInAsAdmin, this.validateProcessItem);
    }

    private sanitizationChain = () => {
        return [
            body('targetUrl', 'You need to provide a proper target url.').isURL().isLength({ min: 7, max: 150 }).trim(),
            body('linksToSet', 'You need to provide a number of links.').isNumeric().trim(),
            body('filterInputStatus', 'You need to provide a valid filter (status)').trim(),
            sanitizeBody('linksToSet').escape(),
        ];
    }

    private renderAddProcessItemPage = (request: express.Request, response: express.Response) => {
        response.render('admin/add-process-item',
            {
                title: 'Create a new process item',
                isAuthenticated: request.user ? true : false,
                isAdmin: request.user.role === 'admin' ? true : false,
                username: request.user ? request.user.email : '',

                targetUrl: '',
                linksToSet: 1,

                validTargetUrl: true,
                validLinksToSet: true,

                flashMessageInfo: request.flash('info'),
                flashMessageTargetUrl: request.flash('targetUrl'),
                flashMessageLinksToSet: request.flash('linksToSet'),
            }
        );
    }

    private addLeadingZero(n) { return n < 10 ? '0' + n : '' + n; }

    private renderArchiveProcessItems = (request: flash.Request, response: express.Response) => {
        this.validationErrors = validationResult(request);
        if (!this.validationErrors.isEmpty()) {
            request.flash('info', 'the filter seems to be false')
        }
        const d = new Date();
        let fromDate = `${d.getFullYear()}-${this.addLeadingZero(d.getMonth() + 1)}-01`;
        let untilDate = `${d.getFullYear()}-${this.addLeadingZero(d.getMonth() + 1)}-${this.addLeadingZero(d.getDate() + 1)}`;
        let query = {
            creationDate: {
                $gt: request.body.filterInputFrom ? new Date(request.body.filterInputFrom) : fromDate,
                $lt: request.body.filterInputUntil ? new Date(request.body.filterInputUntil) : untilDate
            },
            status: request.body.filterInputStatus ? request.body.filterInputStatus : ['open', 'edit', 'submitted', 'verified', 'rejected']
        }
        this.processItems.find(query).sort({ creationDate: -1 })
            .then((processItems) => {

                response.render('admin/process-items-archive',
                    {
                        title: 'All process items',
                        isAuthenticated: request.user ? true : false,
                        isAdmin: request.user.role === 'admin' ? true : false,
                        username: request.user ? request.user.email : '',

                        filterInputStatus: request.body.filterInputStatus ? request.body.filterInputStatus : ['open', 'edit', 'submitted', 'verified', 'rejected'],
                        filterInputFrom: request.body.filterInputFrom ? request.body.filterInputFrom : fromDate,
                        filterInputUntil: request.body.filterInputUntil ? request.body.filterInputUntil : untilDate,

                        processItems,

                        flashMessageInfo: request.flash('info')
                    }
                );
            });
    }

    private isInvalid = (inputField: string) => {
        // only check if we have validationErrors
        if (this.validationErrors != undefined) {
            const paramErrors = this.validationErrors.array().filter(item => item.param == inputField);
            if (paramErrors.length > 0) {
                return true;
            }
            return false;
        }
    }

    private createDateAsUTC = (date) => {
        return new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate(), date.getHours(), date.getMinutes(), date.getSeconds()));
    }

    private addProcessItem = (request: flash.Request, response: express.Response) => {
        this.validationErrors = validationResult(request);
        if (!this.validationErrors.isEmpty()) {
            this.validationErrors.array().forEach(error => {
                request.flash(error.param, error.msg);
            });
            response.render('admin/add-process-item',
                {
                    title: 'Create a new process item',
                    isAuthenticated: request.user ? true : false,
                    isAdmin: request.user.role === 'admin' ? true : false,
                    username: request.user ? request.user.email : '',

                    targetUrl: request.body.targetUrl,
                    linksToSet: request.body.linksToSet,

                    validTargetUrl: this.isInvalid('targetUrl'),
                    validLinksToSet: this.isInvalid('linksToSet'),

                    flashMessageInfo: request.flash('info'),
                    flashMessageTargetUrl: request.flash('targetUrl'),
                    flashMessageLinksToSet: request.flash('linksToSet'),
                }
            );
        } else {
            const processItemData: ProcessItem = request.body;
            let processItemsArray: ProcessItem[] = [];
            for (let index = 0; index < request.body.linksToSet; index++) {
                let tempItem: ProcessItem = new processItemModel(processItemData);
                tempItem._id = randomstring.generate();
                tempItem.creationDate = this.createDateAsUTC(new Date());
                processItemsArray.push(tempItem);
            }
            this.processItems.insertMany(processItemsArray, (error, docs) => {
                if (error)
                    request.flash('info', 'not able to insert process items');
                if (!error)
                    request.flash('info', 'inserted process items');
                this.renderAddProcessItemPage(request, response);
            });
        }
    }

    private verifyProcessItem = (request: flash.Request, response: express.Response) => {
        const id = request.params.id;
        this.processItems.findByIdAndUpdate({ _id: id }, { status: 'verified', verificationDate: this.createDateAsUTC(new Date()) }).then(() => {
            this.renderArchiveProcessItems(request, response);
        });
    }

    private rejectProcessItem = (request: flash.Request, response: express.Response) => {
        const id = request.params.id;
        this.processItems.findByIdAndUpdate({ _id: id }, { status: 'rejected' }).then(() => {
            this.renderArchiveProcessItems(request, response);
        })
    }

    private validateProcessItem = (request: flash.Request, response: express.Response) => {
        //grab id
        const id = request.params.id;
        console.log(`logging id: ${id}`)
        let rt = this;

        this.processItems.findById(id, (err, res: ProcessItem) => {
            console.log(`logging res:ProcessItem: ${res}`)

            // do validation manually here
            let ltc = this.sanitizeString(res.targetUrl);
            let stc = this.sanitizeString(res.backlinkOriginUrl);
            let vali = new Validator(ltc, stc);
            vali.requestUrl().then((crawlerResult: any) => {
                //first: update the validationStats on that processItem
                let stats: ValidationStats = {
                    validationDate: this.createDateAsUTC(new Date()),
                    validationTrigger: 'admin',
                    validationCrawlerResult: crawlerResult.hasLink
                }
                res.validationStats.push(stats)
                //second: update our processitem
                rt.processItems.findByIdAndUpdate({ _id: id }, { validationStats: res.validationStats }).then(() => {
                    // render response
                    response.render('admin/validate-process-item', {
                        title: 'Validation',
                        isAuthenticated: request.user ? true : false,
                        isAdmin: request.user.role === 'admin' ? true : false,
                        username: request.user ? request.user.email : '',

                        id: request.params.id,
                        error: false,
                        pageTitle: crawlerResult.pageTitle,
                        hasLink: crawlerResult.hasLink,
                        links: crawlerResult.links,
                        ltc,
                        stc,

                        validationStats: res.validationStats,

                        flashMessageInfo: request.flash('info')
                    });
                });
            }).catch((err) => {
                if (err.type === 'validation-error') {
                    console.log('validation-error');
                    response.render('admin/validate-process-item', {
                        title: 'Validation',
                        isAuthenticated: request.user ? true : false,
                        isAdmin: request.user.role === 'admin' ? true : false,
                        username: request.user ? request.user.email : '',

                        userLtc: err.userLtc,
                        userStc: err.userStc,
                        ltc: err.ltc,
                        stc: err.stc,

                        flashMessageInfo: request.flash('info')
                    });
                }
            });
        });
    }

    private sanitizeString(str) {
        str = str.replace(/[^a-z0-9.:/,_-]/gim, "");
        return str.trim();
    }
}

export default AdminProcessItemController;
import Controller from '../interfaces/controller.interface';
// load up the user model
import userModel from '../models/users.model';
import User from '../interfaces/user.interface';
// load up the process item model
import processItemModel from '../models/process-item.model';
import ProcessItem from '../interfaces/process-item.interface';

import * as express from 'express';
import * as passport from 'passport';
import * as flash from 'connect-flash/lib';
import { body, validationResult } from 'express-validator/check';
import { sanitizeBody } from 'express-validator/filter';
import * as expressValidator from 'express-validator';
import * as randomstring from 'randomstring';
import { isLoggedIn, isLoggInAsAdmin } from '../guards/auth.guard';
import { Validator } from '../services/validation.service';

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
        this.router.post(`${this.path}`, isLoggInAsAdmin, this.filterArchiveProcessItems);
        this.router.get(`${this.path}/add`, isLoggInAsAdmin, this.renderAddProcessItemPage);
        this.router.post(`${this.path}/add`, isLoggInAsAdmin, this.sanitizationChain(),
        this.addProcessItem);
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

    private renderArchiveProcessItems = (request: flash.Request, response: express.Response) => {
        this.processItems.find()
            .then((processItems) => {
                response.render('admin/process-items-archive',
                    { 
                        title: 'All process items',
                        isAuthenticated: request.user ? true : false,
                        isAdmin: request.user.role === 'admin' ? true : false,
                        username: request.user ? request.user.email : '',

                        filterInputStatus: '',

                        processItems,
                    
                        flashMessageInfo: request.flash('info')
                    }              
                );
            });
    }

    private isInvalid = (inputField: string) => {
        // only check if we have validationErrors
        if (this.validationErrors!=undefined) {
            const paramErrors = this.validationErrors.array().filter(item => item.param == inputField);
            if(paramErrors.length>0) {
                return true;
            }
            return false;
        }
    }

    private createDateAsUTC = (date) => {
        return new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate(), date.getHours(), date.getMinutes(), date.getSeconds()));
    }

    private addProcessItem  = (request: flash.Request, response: express.Response) => {
        this.validationErrors = validationResult(request);
        if(!this.validationErrors.isEmpty()) {
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

    private filterArchiveProcessItems = (request: flash.Request, response: express.Response) => {
        this.validationErrors = validationResult(request);
        if(!this.validationErrors.isEmpty()) {
            request.flash('info', 'the filter seems to be false')
        }
        let queryObject;
        queryObject = {
            status: request.body.filterInputStatus
        }
        this.processItems.find(queryObject)
            .then((processItems) => {
                response.render('admin/process-items-archive',
                    { 
                        title: 'All process items',
                        isAuthenticated: request.user ? true : false,
                        isAdmin: request.user.role === 'admin' ? true : false,
                        username: request.user ? request.user.email : '',

                        filterInputStatus: request.body.filterInputStatus,

                        processItems,
                    
                        flashMessageInfo: request.flash('info')
                    }              
                );
            });
    }
}

export default AdminProcessItemController;
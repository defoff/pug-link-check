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
import { toUnicode } from 'punycode';

class UserProcessItemController implements Controller {
    public path = '/dashboard';
    public router = express.Router();
    private users = userModel;
    private processItems = processItemModel;
    private validationErrors;

    constructor() {
        this.initializeRoutes();
    }

    private initializeRoutes() {
        this.router.get(`${this.path}`, isLoggedIn, this.renderDashboardPage);
        this.router.get(`${this.path}/checkout`, isLoggedIn, this.checkoutProcessItem);
        this.router.get(`${this.path}/edit`, isLoggedIn, this.renderEditProcessItemPage);
        this.router.post(`${this.path}/edit`, isLoggedIn, this.sanitizationChain(), this.finishProcessItem);
    }

    private sanitizationChain = () => {
        return [
            body('targetUrl', 'You need to provide a proper target url.').isURL().isLength({ min: 7, max: 150 }).trim(),
            body('backlinkOriginUrl', 'You need to provide a proper backlink origin url.').isURL().isLength({ min: 7, max: 150 }).trim(),
        ];
    }

    private checkoutProcessItem = (request: flash.Request, response: express.Response) => {
        this.isWorkingOnProcessItem(request, response, (done) => {
            // if user is not registered in any process item
            if (done==null) {
                // get and set the next process item for user
                this.findNextProcessItemForUser(request,response, (done) => {
                    if (done)
                        this.renderEditProcessItemPage(request, response);
                    if (!done)
                        this.renderDashboardPage(request, response);
                });
            } 
            // if user is registered in any process item 
            else {
                // render edit page
                this.renderEditProcessItemPage(request, response);
            }
        });
    }

    private isWorkingOnProcessItem = (request: flash.Request, response: express.Response, done) => {
        this.processItems.find({ editUser: request.user._id }, function(err, processItems) {
            if (err)
                return done(err);
            
            if (processItems.length==0)
                return done(null)
            
            if (processItems.length>0)
                return done(processItems);
        }); 
    }

    private findNextProcessItemForUser = (request: flash.Request, response: express.Response, done) => {
        this.processItems.find({ editUser: null, status: 'open' })
        .then((availableItems: ProcessItem[]) => {
            if (availableItems.length>0) {
                let firstItem = availableItems[0];
                firstItem.editUser = request.user._id;
                firstItem.editUsers.push(request.user._id);
                firstItem.status = 'edit'
                firstItem.editDate = this.createDateAsUTC(new Date()),
                // editDate and editDates need to be set here
                this.processItems.findByIdAndUpdate(firstItem._id, { editUser: request.user._id, editUsers: firstItem.editUsers, status: firstItem.status, editDate: this.createDateAsUTC(new Date()) })
                    .then(() => {
                        request.flash('info', 'Neuer Link in zur Bearbeitung geöffnet.');
                        // redirect to his edit page
                        return done(true);
                    });
            } else {
                request.flash('info', 'Zur Zeit gibt es keine Backlinks. Bitte versuchen Sie es später. Sie könne sich per Mail informieren lassen sobald neue Backlinks verfügbar sind.');
                return done(null);
            }
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

    private finishProcessItem = (request: flash.Request, response: express.Response) => {
        this.isWorkingOnProcessItem(request, response, (done) => {
            // if user is not registered in any process item
            if (done==null) {
                // redirect user to dashboard
                request.flas('Fehler: 0x34: Die Aktion konnte nicht durchgeführt werden.');
                response.redirect('/dashboard');
            } 
            // if user is registered in any process item 
            else {
                // get form data ...
                this.validationErrors = validationResult(request);
                if(!this.validationErrors.isEmpty()) {
                    this.validationErrors.array().forEach(error => {
                        request.flash(error.param, error.msg);
                    });
                    response.render('users/edit-process-item', 
                        { 
                            title: 'Create a new process item',
                            isAuthenticated: request.user ? true : false,
                            isAdmin: request.user.role === 'admin' ? true : false,
                            username: request.user ? request.user.email : '',
        
                            targetUrl: request.body.targetUrl,
                            backlinkOriginUrl: request.body.backlinkOriginUrl,
        
                            validTargetUrl: this.isInvalid('targetUrl'),
                            validBacklinkOriginUrl: this.isInvalid('backlinkOriginUrl'),      
                            
                            flashMessageInfo: request.flash('info'),
                            flashMessageTargetUrl: request.flash('targetUrl'),
                            flashMessageBacklinkOriginUrl: request.flash('backlinkOriginUrl'),
                        }
                    );
                } else {
                    // get the item
                    let tmp: ProcessItem = done[0];

                    // finish item
                    this.processItems.findByIdAndUpdate(tmp._id, 
                        {
                            editUser: null,
                            submissionDate: this.createDateAsUTC(new Date()),
                            submissionUser: request.user._id,
                            status: 'submitted',
                            backlinkOriginUrl: request.body.backlinkOriginUrl
                        }, (err, res) => {
                            if (err)
                                request.flash('info', 'Fehler 0x35: Die Aktion konnte nicht abgeschlossen werden.');
                            if(!err)
                                request.flash('info', 'Der Backlink wurde erfolgreich hinzugefügt.');
                            this.renderDashboardPage(request, response);
                        }
                    )
                }
            }
        });
    }

    private renderEditProcessItemPage = (request: flash.Request, response: express.Response) => {
        this.isWorkingOnProcessItem(request, response, (done) => {
            // if user is not registered in any process item
            if (done==null) {
                // redirect him to trigger the checkout process
                response.redirect('/dashboard/checkout')
            }
            // if user is registered in any process item 
            if (done.length>0) {                
                // render edit page
                response.render('users/edit-process-item', 
                    {
                        title: 'Create a new process item',
                        isAuthenticated: request.user ? true : false,
                        isAdmin: request.user.role === 'admin' ? true : false,
                        username: request.user ? request.user.email : '',

                        targetUrl: done[0].targetUrl,
                        backlinkOriginUrl: '',
        
                        validTargetUrl: true,
                        validBacklinkOriginUrl: true,
                        
                        flashMessageInfo: request.flash('info'),
                        flashMessageTargetUrl: request.flash('targetUrl'),
                        flashMessageBacklinkOriginUrl: request.flash('backlinkOriginUrl'),
                    }
                );
            }
        });
    }

    private renderDashboardPage = (request: flash.Request, response: express.Response) => {
        let isAdmin = false;
        if(request.user) {
            isAdmin = request.user.role === 'admin' ? true : false;
        }
        response.render('users/dashboard',
            {
                title: 'Dashboard',
                isAuthenticated: request.user ? true : false,
                isAdmin: isAdmin,
                username: request.user ? request.user.email : '',
                
                flashMessageInfo: request.flash('info'),
            }
        );
    }

}

export default UserProcessItemController;
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
        this.router.get(`${this.path}/status`, isLoggedIn, this.renderProcessItemStatusPage);
        this.router.post(`${this.path}/status`, isLoggedIn, this.renderProcessItemStatusPage);
        this.router.get(`${this.path}/transaction`, isLoggedIn, this.renderUserTransactionPage);
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
        this.processItems.find({ status: 'open' })
        .then((availableItems: ProcessItem[]) => {
            if (availableItems.length>0) {
                const nowDate = this.createDateAsUTC(new Date());
                let editDates = availableItems[0].editDates;
                editDates.push(nowDate);
                let editUsers = availableItems[0].editUsers;
                editUsers.push(request.user._id);
                this.processItems.findByIdAndUpdate(availableItems[0]._id, 
                        { 
                            editUser: request.user._id, 
                            editUsers: editUsers,
                            status: 'edit', 
                            editDate: nowDate,
                            editDates: editDates,
                        })
                    .then(() => {
                        request.flash('info', 'Neuer Link zur Bearbeitung geöffnet.');
                        // redirect to his edit page
                        return done(true);
                    });
            } else {
                request.flash('info', 'Zur Zeit gibt es keine Backlinks. Bitte versuchen Sie es später. Sie können sich per Mail informieren lassen sobald neue Backlinks verfügbar sind.');
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
                request.flash('Fehler: 0x34: Die Aktion konnte nicht durchgeführt werden.');
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

                        documentId: done[0]._id,
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

    private renderProcessItemStatusPage = (request: flash.Request, response: express.Response) => {
        const d = new Date();
        let fromDate = `${d.getFullYear()}-${this.addLeadingZero(d.getMonth() + 1)}-01`;
        let untilDate = `${d.getFullYear()}-${this.addLeadingZero(d.getMonth() + 1)}-${this.addLeadingZero(d.getDate()+1)}`;
        let query = {
            creationDate: {
                $gt: request.body.filterInputFrom ? new Date(request.body.filterInputFrom) : fromDate,
                $lt: request.body.filterInputUntil ? new Date(request.body.filterInputUntil) : untilDate
            },
            status: request.body.filterInputStatus ? request.body.filterInputStatus : ['submitted', 'verified', 'rejected'],
            submissionUser: request.user._id,
        }
        this.processItems.find(query).sort({ creationDate: -1 })
        .then((processItems) => {

            response.render('users/status-process-items.pug',
                {
                    title: 'Status: Meine Backlinks',
                    isAuthenticated: request.user ? true : false,
                    isAdmin: request.user.role === 'admin' ? true : false,
                    username: request.user ? request.user.email : '',

                    filterInputStatus: request.body.filterInputStatus ? request.body.filterInputStatus : ['submitted', 'verified', 'rejected'],
                    filterInputFrom: request.body.filterInputFrom ? request.body.filterInputFrom : fromDate,
                    filterInputUntil: request.body.filterInputUntil ? request.body.filterInputUntil : untilDate,

                    processItems,

                    flashMessageInfo: request.flash('info')
                }
            );
        });
    }

    private addLeadingZero(n) { return n < 10 ? '0' + n : '' + n; }

    private renderUserTransactionPage = (request: flash.Request, response: express.Response) => {
        
        const d = new Date();
        let fromDate = `${d.getFullYear()}-${this.addLeadingZero(d.getMonth() + 1)}-01`;
        let untilDate = `${d.getFullYear()}-${this.addLeadingZero(d.getMonth() + 1)}-${this.addLeadingZero(d.getDate()+1)}`;
        let query = {
            creationDate: {
                $gt: fromDate,
                $lt: untilDate
            },
            status: ['verified'],
            submissionUser: request.user._id
        }
        this.processItems.find(query)
        .sort({ submissionDate: -1 })
        .then((processItems) => {
            response.render('users/transaction-process-items.pug',
                {
                    title: 'Abrechnung',
                    isAuthenticated: request.user ? true : false,
                    isAdmin: request.user.role === 'admin' ? true : false,
                    username: request.user ? request.user.email : '',

                    fromDate,
                    untilDate,

                    processItems,
                        
                    flashMessageInfo: request.flash('info'),
                }
            );
        });       
    }

}

export default UserProcessItemController;
import Controller from '../interfaces/controller.interface';
// load up the user model
import userModel from '../models/users.model';
import User from '../interfaces/user.interface';

import * as express from 'express';
import * as passport from 'passport';
import * as flash from 'connect-flash/lib';
import { urlencoded } from 'body-parser';
import { isLoggedIn, isLoggInAsAdmin } from '../guards/auth.guard';

class AdminUserController implements Controller {
    public path = '/admin/users';
    public router = express.Router();
    private users = userModel;

    constructor() {
        this.initializeRoutes();
    }

    private initializeRoutes() {
        // =====================================
        // ADMIN: ALL USers=====================
        // =====================================
        this.router.get(`${this.path}/users-list/`, isLoggInAsAdmin, this.renderUsersList);
        this.router.get(`${this.path}/register-new-user/`, isLoggInAsAdmin, this.registerNewUser);
        this.router.post(`${this.path}/register-new-user/`, isLoggInAsAdmin, passport.authenticate('local-signup', {
            successRedirect : '/admin/users/users-list/', // redirect to the secure profile section
            failureRedirect : '/admin/users/users-list/', // redirect back to the signup page if there is an error
            failureFlash : true, // allow flash messages
            session: false // prevent auto-login
        }));
    }

    private renderUsersList = (request: flash.Request, response: express.Response) => {
        this.users.find()
            .then((users) => {
                response.render('admin/users-list',
                    { 
                        title: 'Userslist',
                        isAuthenticated: request.user ? true : false,
                        isAdmin: request.user.role === 'admin' ? true : false,
                        username: request.user ? request.user.email : '',
                        users: users,
                        flashMessage: request.flash('info'),
                    }
                );
            });
    }

    private registerNewUser = (request: express.Request, response: express.Response) => {
        request.flash('Fehler: 0x34: Die Aktion konnte nicht durchgeführt werden.');
        response.render('admin/register-new-user',
            { 
                title: 'Userslist',
                isAuthenticated: request.user ? true : false,
                isAdmin: request.user.role === 'admin' ? true : false,
                username: request.user ? request.user.email : '',
    
                flashMessage: request.flash('info'),
            }        
        );
    }
}

export default AdminUserController;
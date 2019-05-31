import Controller from '../interfaces/controller.interface';
// load up the user model
import userModel from '../models/users.model';
import User from '../interfaces/user.interface';

import * as express from 'express';
import * as passport from 'passport';
import * as flash from 'connect-flash/lib';
import { isLoggedIn, isLoggInAsAdmin } from '../guards/auth.guard';


class UserController implements Controller {
    public path = '/users';
    public router = express.Router();
    private users = userModel;

    constructor() {
        this.initializeRoutes();
    }

    private initializeRoutes() {
        // =====================================
        // SIGNUP ==============================
        // =====================================
        this.router.get(`${this.path}/signup/`, this.renderSignupPage);
        this.router.post(`${this.path}/signup/`, passport.authenticate('local-signup', {
            successRedirect : '/users/login/', // redirect to the secure profile section
            failureRedirect : '/users/signup/', // redirect back to the signup page if there is an error
            failureFlash : true, // allow flash messages
            session: false // prevent auto-login
        })); 
        // =====================================
        // LOGIN ===============================
        // =====================================
        this.router.get(`${this.path}/login/`, this.renderLoginPage);
        this.router.post(`${this.path}/login/`, passport.authenticate('local-login', {
            successRedirect : '/dashboard', // redirect to the secure profile section
            failureRedirect : '/users/login/', // redirect back to the signup page if there is an error
            failureFlash : true // allow flash messages
        }));

        // =====================================
        // LOGOUT ==============================
        // =====================================
        this.router.get(`${this.path}/logout/`, isLoggedIn, function(request: express.Request, response: express.Response) {
            request.logOut();
            response.redirect('/users/login/');
        });

    }

    private renderLoginPage = (request: flash.Request, response: express.Response) => {     
        response.render('users/login', 
            { 
                title: 'Login', 
                isAuthenticated: request.user ? true : false,
                isAdmin: request.user && request.user.role === 'admin' ? true : false,
                username: request.user ? request.user.email : '',
                flashMessage: request.flash('loginMessage') 
            }
        );
    }
    
    private renderSignupPage = (request: flash.Request, response: express.Response) => {     
        response.render('users/signup', 
            { 
                title: 'Signup', 
                isAuthenticated: request.user ? true : false,
                isAdmin: request.user && request.user.role === 'admin' ? true : false,
                username: request.user ? request.user.email : '',
                flashMessage: request.flash('signupMessage')
            }
        );
    }
}

export default UserController;
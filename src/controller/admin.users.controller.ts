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
}

export default AdminUserController;
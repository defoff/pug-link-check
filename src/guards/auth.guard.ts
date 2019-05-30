import * as express from 'express';

const isLoggedIn = function(request: express.Request, response: express.Response, next: express.NextFunction) {
  // if user is authenticated in the session, carry on 
  if (request.isAuthenticated())
      return next();

  // if they aren't redirect them to the home page
  response.redirect('/users/login/');
}

const isAdmin = function(request: express.Request, response: express.Response, next: express.NextFunction) {
  // if user is authenticated in the session, carry on 
  if (request.isAuthenticated() && request.user.role === 'admin')
      return next();

  // if they aren't redirect them to the home page
  response.redirect('/users/login/');
}

export { isLoggedIn, isAdmin } 
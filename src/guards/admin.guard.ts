import * as express from 'express';

export default function(request: express.Request, response: express.Response, next: express.NextFunction) {
  // if user is authenticated in the session, carry on 
  if (request.isAuthenticated() && request.user.role === 'admin')
      return next();

  // if they aren't redirect them to the home page
  response.redirect('/users/login/');
}
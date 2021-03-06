// config/passport.js

// load all the things we need
var LocalStrategy   = require('passport-local').Strategy;

// load up the user model
import userModel from '../models/users.model';
import User from '../interfaces/user.interface';

// expose this function to our app using module.exports
export default function(passport) {

    // =========================================================================
    // passport session setup ==================================================
    // =========================================================================
    // required for persistent login sessions
    // passport needs ability to serialize and unserialize users out of session

    // used to serialize the user for the session
    passport.serializeUser(function(user, done) {
        done(null, user.id);
    });

    // used to deserialize the user
    passport.deserializeUser(function(id, done) {
        userModel.findById(id, function(err, user) {
            done(err, user);
        });
    });

    // =========================================================================
    // LOCAL SIGNUP ============================================================
    // =========================================================================
    // we are using named strategies since we have one for login and one for signup
    // by default, if there was no name, it would just be called 'local'

    passport.use('local-signup', new LocalStrategy({
        // by default, local strategy uses username and password, we will override with email
        usernameField : 'email',
        passwordField : 'password',
        passReqToCallback : true // allows us to pass back the entire request to the callback
    },
    function(req, email, password, done) {

        // asynchronous
        // User.findOne wont fire unless data is sent back
        process.nextTick(function() {
        // find a user whose email is the same as the forms email
            // we are checking to see if the user trying to login already exists
            userModel.findOne({ 'email' :  email }, function(err, user) {
                // if there are any errors, return the error
                if (err)
                    return done(err);

                // check to see if theres already a user with that email
                if (user) {
                    // ERROR REASON: email is allready taken
                    return done(null, false, req.flash('signupMessage', 'Fehler 3x23: Es konnte kein Benutzerkonto angelegt werden.'));
                } else {

                    // if there is no user with that email
                    // create the user
                    var newUser            = new userModel();

                    // set the user's local credentials
                    newUser.email    = email;
                    newUser.password = newUser.generateHash(password);

                    // save the user
                    newUser.save(function(err) {
                        if (err)
                            throw err;
                        return done(null, newUser);
                    });
                }
            });   
        });
    }));

    // =========================================================================
    // LOCAL LOGIN =============================================================
    // =========================================================================
    // we are using named strategies since we have one for login and one for signup
    // by default, if there was no name, it would just be called 'local'

    passport.use('local-login', new LocalStrategy({
        // by default, local strategy uses username and password, we will override with email
        usernameField : 'email',
        passwordField : 'password',
        passReqToCallback : true // allows us to pass back the entire request to the callback
    },
    function(req, email, password, done) { // callback with email and password from our form

        // find a user whose email is the same as the forms email
        // we are checking to see if the user trying to login already exists
        userModel.findOne({ 'email' :  email }, function(err, user) {
            // if there are any errors, return the error before anything else
            if (err)
                return done(err);

            // if no user is found, return the message
            if (!user)
                // ERROR REASON: no user found
                return done(null, false, req.flash('loginMessage', 'Fehler 3x17: Der Anmeldevorgang konnte nicht durchgeführt werden.')); // req.flash is the way to set flashdata using connect-flash

            // if (!user.verified)
                // return done(null, false, req.flash('loginMessage', 'User not verified.')); // req.flash is the way to set flashdata using connect-flash

            // if the user is found but the password is wrong
            if (!user.validPassword(password))
                // ERROR REASON: Oops! Wrong password.
                return done(null, false, req.flash('loginMessage', 'Fehler 3x56: Der Anmeldevorgang konnte nicht durchgeführt werden.')); // create the loginMessage and save it to session as flashdata

            // all is well, return successful user
            return done(null, user);
        });

    }));
};
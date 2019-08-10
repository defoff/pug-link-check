import * as express from 'express';
import Controller from '../interfaces/controller.interface';
import { body, validationResult } from 'express-validator/check';
// load up the applicant model
import applicantModel from '../models/applicants.model';
import Applicant from '../interfaces/applicant.interface';

class AnonymousController implements Controller {
    public path = '/';
    public router = express.Router();
    private applicants = applicantModel;
    private validationErrors;

    constructor() {
        this.initializeRoutes();
    }

    private initializeRoutes() {
        this.router.get(`${this.path}`, this.renderLandingPage);
        this.router.get(`${this.path}signup/`, this.renderSignupPage);
        this.router.post(`${this.path}signup/`, this.signupSanitizationChain(), this.processApplication);
    }

    private signupSanitizationChain = () => {
        return [
            body('inputEmail', 'Ohne Angabe einer gültigen eMail-Adresse ist eine Bewerbung leider nicht möglich.').isEmail(),
            body('inputForename', 'Es muss ein Vorname angegeben werden.').not().isEmpty().trim().escape(),
            body('inputSurname', 'Es muss ein Nachname angegeben werden.').not().isEmpty().trim().escape(),
            body('inputLoi', 'Das Anschreiben scheint nicht gültig zu sein. Bitte überprüfen und erneut versuchen.').escape(),
            body('inputBirthdate', 'Das Geburtsdatum ist für eine Bewerbung erforderlich.').not().isEmpty(),
        ];
    }

    private renderLandingPage = (request: express.Request, response: express.Response) => {
        response.render('anonymous/landing', {
            title: 'LINX: surfen und Geld verdienen'
        });
    }

    private renderSignupPage = (request: express.Request, response: express.Response) => {
        response.render('anonymous/signup', {
            title: 'Bewerben und Geld verdienen!',
            flashMessageInfo: request.flash('info')
        });
    }

    private processApplication  = (request: express.Request, response: express.Response) => {
                // get form data ...
                this.validationErrors = validationResult(request);
                if(!this.validationErrors.isEmpty()) {
                    this.validationErrors.array().forEach(error => {
                        request.flash(error.param, error.msg);
                    });
                    response.render('anonymous/signup', 
                        { 
                            title: 'Bewerben und Geld verdienen!',
                            isAuthenticated: request.user ? true : false,
                            isAdmin: request.user && request.user.role === 'admin' ? true : false,
                            username: request.user ? request.user.email : '',
        
                            inputEmail: request.body.inputEmail,
                            inputForename: request.body.inputForename,
                            inputSurname: request.body.inputSurname,
                            inputLoi: request.body.inputLoi,
                            inputBirthdate: request.body.inputBirthdate,
        
                            validInputEmail: this.isInvalid('inputEmail'),
                            validInputForename: this.isInvalid('inputForename'),      
                            validInputSurname: this.isInvalid('inputSurname'),
                            validInputLoi: this.isInvalid('inputLoi'),
                            validInputBirthdate: this.isInvalid('inputBirthdate'),

                            flashMessageInfo: request.flash('info'),
                            flashMessageInputEmail: request.flash('inputEmail'),
                            flashMessageInputForename: request.flash('inputForename'),
                            flashMessageInputSurname: request.flash('inputSurname'),
                            flashMessageInputLoi: request.flash('inputLoi'),
                            flashMessageInputBirthdate: request.flash('inputBirthdate')
                        }
                    );
                } else {
                    const applicantData: Applicant = request.body;
                    applicantData.email = request.body.inputEmail;
                    applicantData.forename = request.body.inputForename;
                    applicantData.surname = request.body.inputSurname;
                    applicantData.loi = request.body.inputLoi;
                    applicantData.birthdate = request.body.inputBirthdate;
                    this.applicants.insertMany([applicantData], (error, applicant: Applicant) => {
                        if (error)
                            request.flash('info', 'Es ist ein Fehler aufgetreten. Fehlercode: x3ff5');
                        if (applicant)
                            response.render('anonymous/signup-confirmation', {
                                title: 'eMail bestätigen',
                                isAuthenticated: request.user ? true : false,
                                isAdmin: request.user && request.user.role === 'admin' ? true : false,
                                username: request.user ? request.user.email : '',
                                flashMessageInfo: request.flash('info'),
                                inputEmail: request.body.inputEmail,
                                inputForename: request.body.inputForename,
                                inputSurname: request.body.inputSurname,                                             
                            });
                    });
                }
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
}

export default AnonymousController;
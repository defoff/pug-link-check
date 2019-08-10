import * as mongoose from 'mongoose';
import Applicant from '../interfaces/applicant.interface';
import * as bcrypt from 'bcrypt';
import * as randomstring from 'randomstring';

const applicantSchema = new mongoose.Schema({
    _id               : { type: String, default: new mongoose.Types.ObjectId().toHexString() },
    email             : String,
    forename          : String,
    surname           : String,
    loi               : String,
    birthdate         : Date,
    verificationToken : { type: String, default: '' },
    emailConfirmed    : { type: Boolean, default: false }
});


const applicantModel = mongoose.model<Applicant & mongoose.Document>('Applicant', applicantSchema);

export default applicantModel;


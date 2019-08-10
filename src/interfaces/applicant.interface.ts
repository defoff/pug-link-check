interface Applicant {
    _id: string;
    email: string;
    forename: string;
    surname: string;
    loi: string;
    birthdate: Date;
    verificationToken: string;
    emailConfirmed: boolean;
}

export default Applicant;
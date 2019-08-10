import * as sgMail from '@sendgrid/mail';

class MailService {

    public message = {};
    public to: string;
    public from: string = 'nutzerverwaltung@genuss.de';
    public subject: string = 'Freischaltung';
    public text: string;
    public html: string;

    constructor() {
        sgMail.setApiKey(process.env.SENDGRID_API_KEY);
        const msg = {
            to: 'rolf.cook@googlemail.com',
            from: 'test@example.com',
            subject: 'Sending with Twilio SendGrid is Fun',
            text: 'and easy to do anywhere, even with Node.js',
            html: '<strong>and easy to do anywhere, even with Node.js</strong>',
        };
        //this.sendMail(msg);
    }
    private sendMail = (message: any) => {
        sgMail.send(message);
    }
    public sendVerificationMail (to, token) {
        console.log(`Logging confirmationToken from mail.service.ts on sendVerificationMail: ${token}`)
        const msg = {
            to: to,
            from: this.from,
            subject: this.subject,
            text: `Hier ist der Aktivierungslink: http//:localhost:5000/activation/${token}`,
            html: `<p>Hier ist der Aktivierungslink: <a href='http://localhost:5000/activation/${token}'>Aktivierungslink</a></p>`
        }
        this.sendMail(msg);
    }
}

export default MailService;
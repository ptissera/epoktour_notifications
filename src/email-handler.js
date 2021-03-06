
var nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    service: 'mail.epoktour.fr',
    port: 465,
    secure: true,
    auth: {
      user: 'notify@epoktour.fr',
      pass: '&2oadN+HFtF1'
    },
    tls: {
      // do not fail on invalid certs
      rejectUnauthorized: false
    }
  });

const sendEmail = (mailOptions) => {
    transporter.sendMail(mailOptions, function(error, info){
        if (error) {
          console.log(error);
        } else {
          console.log('Email sent: ' + info.response);
        }
      });
} 

export const emailHandler = {
    nofifyMinTravelers(to, data) {

        let text = 'hola chango';

        const mailOptions = {
            from: 'notify@epoktour.fr',
            to,
            subject: 'Sending Email using Node.js',
            text
          }
        sendEmail(mailOptions);
    }
}
  

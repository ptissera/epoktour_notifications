
var nodemailer = require('nodemailer');
const util = require('util');

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

const sendMail = util.promisify(transporter.sendMail).bind(transporter);

const sendEmailToGuide = async(mailOptions) => {
    await sendMail(mailOptions);
}

const generateEmailBody = (metaData) => {
  let body = `
  
  Tour information detail (${metaData.tour_id}):
      ${metaData.travel_date_key} - ${metaData.package_group_slug}
      ${JSON.stringify(metaData.bookings[0].package).split('<br>').join('  ')}
      

  Bookings:
  `;
  metaData.bookings.forEach(booking => {
    body += `
      adult: ${booking['tour-adult']}   - children: ${booking['tour-children']}   - student: ${booking['tour-student']}   - infant: ${booking['tour-infant']}
      coupon code: ${booking['coupon-code']}

      Contact Information:
         first name: ${booking.first_name}
         last name: ${booking.last_name}
         email: ${booking.email}
         phone: ${booking.phone}
         country: ${booking.country}
      
      Travelers:
    `;
    booking.traveller_first_name.forEach((first_name, index) => {
      body += `         ${first_name}, ${booking.traveller_last_name[index]}
    `;
    });
    body += `
       
       ------------------------------------------------------------------------------

    `
  });

  body += `


          Tour System Notification
  `
  console.log(body)
  return body;
}

const senddToNotifyMinTravelers = (metaData) => {
  const keys = Object.keys(metaData);
    keys.forEach(async (key) => {
      if (metaData[key].send_notify_min==false || metaData[key].send_notify_1 || metaData[key].send_notify_24 || metaData[key].send_notify_48) {
        let text = generateEmailBody(metaData[key]);

        const mailOptions = {
            from: 'notify@epoktour.fr',
            to: metaData[key].email_guide,
            subject: 'Min travelers achived',
            text
          }
         await sendEmailToGuide(mailOptions);
      }
    });
}

const emailHandler = {
  senddToNotifyMinTravelers
}

module.exports = {
  emailHandler
}

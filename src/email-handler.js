
var nodemailer = require('nodemailer');
const util = require('util');
const { mailConfig } = require('./config');

const transporter = nodemailer.createTransport(mailConfig);

const sendMail = util.promisify(transporter.sendMail).bind(transporter);

const sendEmailToGuide = async(metaData, subject, text) => {
  const mailOptions = {
    from: FROM,
    bcc: COPIA,
    to: metaData.email_guide,
    subject,
    text
  };
    await sendMail(mailOptions);
}

const getNombreVisita = (metaData) => {
  let nombreVisita = metaData.bookings[0].package.split('<br>');
  if (nombreVisita.length === 2) {
    nombreVisita = nombreVisita[1];
  } else {
    nombreVisita = nombreVisita.join('  ')
  }
  return nombreVisita;
}

const generateMessageMin = (metaData) => {
  return `
  Bonjour,
Le nombre de participants minimum a été atteint pour la visite "${getNombreVisita(metaData)}" ${metaData.tour_start_time} qui est donc confirmée.

La liste des participants vous sera envoyée 24h avant la visite.

Merci !

  ${generateBookingDetail(metaData)}
  `;
}

const generateMessage48Hours = (metaData) => {
  let adults = 0;
  metaData.bookings.forEach(booking => {
    if (parseInt(booking['tour-adult']).length > 0) {
      adults += parseInt(booking['tour-adult']);
    }
  });

  return `
  Bonjour,

Le nombre minimum de participants pour la visite "${getNombreVisita(metaData)}" ${metaData.tour_start_time} n'a pas été atteint. Seulement x ${adults} adultes ont réservé. La visite va être reprogrammée sauf accord exceptionnel de votre part de maintenir la visite. Cet accord sera à nous envoyer par mail le plus rapidement possible.

Bien cordialement


${generateBookingDetail(metaData)}
`;
}

const generateMessage1HourAnd24Hours = (metaData) => {
  return `
  Confirmation de la visite "${getNombreVisita(metaData)}" ${metaData.tour_start_time}
Liste des participants 
             ${generateBookingDetail(metaData)}
N.B : N'oubliez pas :
- Arriver 5 min en avance au point de RDV
- Avoir un petit flacon de gel hydroalcoolique à disposition pendant la visite 
- Sensibiliser les participants aux commentaires TripAdvisor à la fin de la visite."
  `;
}

const generateBookingDetail = (metaData) => {
  let body = `

  ============================================
    Bookings Detail:
  ============================================
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
    `;
  });

  body += `


          Tour System Notification
  `;
  return body;
}

const FROM = 'notify@epoktour.fr';
const COPIA = 'infotourf@gmail.com';
const SUBJECT_MIN = 'Epoktour - Nombre minimum de visiteurs atteint';
const SUBJECT_1_HOUR_24_HOURS = 'Epoktour - Détail des réservations';
const SUBJECT_48_HOURS = 'Epoktour - 48h Nombre minimum de visiteurs non atteint';

const senddToNotifyMinTravelers = (metaData) => {
  const keys = Object.keys(metaData);
    keys.forEach(async (key) => {
      if (metaData[key].send_notify_min || metaData[key].send_notify_1 || metaData[key].send_notify_24 || metaData[key].send_notify_48) {
        if (metaData[key].send_notify_min) {
          await sendEmailToGuide(metaData[key], SUBJECT_MIN, generateMessageMin(metaData[key]));
        }
        if (metaData[key].send_notify_1 || metaData[key].send_notify_24) {
          await sendEmailToGuide(metaData[key], SUBJECT_1_HOUR_24_HOURS, generateMessage1HourAnd24Hours(metaData[key]));
        }
        if (metaData[key].send_notify_48) {
          await sendEmailToGuide(metaData[key], SUBJECT_48_HOURS, generateMessage48Hours(metaData[key]));
        }
        
      }
    });
}

const emailHandler = {
  senddToNotifyMinTravelers
}

module.exports = {
  emailHandler
}

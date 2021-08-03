
const moment = require("moment");
var nodemailer = require('nodemailer');
const util = require('util');
const { mailConfig } = require('./config');

const transporter = nodemailer.createTransport(mailConfig);
const sendMail = util.promisify(transporter.sendMail).bind(transporter);

const FROM = 'notify@epoktour.fr';
const COPIA = 'infotourf@gmail.com';
const SUBJECT_MIN = 'Epoktour - Nombre minimum de visiteurs atteint';
const SUBJECT_1_HOUR_24_HOURS = 'Epoktour - Détail des réservations';
const SUBJECT_48_HOURS = 'Epoktour - 48h Nombre minimum de visiteurs non atteint';

const sendEmailToGuide = async (metaData, subject, text) => {
  const mailOptions = {
    from: FROM,
    cc: [COPIA, 'tissera.pablo@gmail.com'],
    to: metaData.email_guide,
    subject,
    text
  };
  await sendMail(mailOptions);
}

const sendEmailToGuideParaPablo = async (metaData, subject, text) => {
  const mailOptions = {
    from: FROM,
    to: 'tissera.pablo@gmail.com',
    subject,
    text
  };
  await sendMail(mailOptions);
}

const generateMessageMin = (metaData) => {
  return `
  Bonjour,
Le nombre de participants minimum a été atteint pour la visite "${metaData.tour_name_email}" ${metaData.tour_start_time} qui est donc confirmée.

La liste des participants vous sera envoyée 24h avant la visite.

Merci !

  ${generateBookingDetail(metaData)}
  `;
}

const generateMessage48Hours = (metaData) => {
  let adults = 0;
  metaData.bookings.forEach(booking => {
    if (!!booking['tour-adult'] && parseInt(booking['tour-adult']) > 0) {
      adults += parseInt(booking['tour-adult']);
    }
  });

  return `
  Bonjour,

Le nombre minimum de participants pour la visite "${metaData.tour_name_email}" ${metaData.tour_start_time} n'a pas été atteint. Seulement ${adults} adulte(s) ont réservé. La visite va être reprogrammée sauf accord exceptionnel de votre part de maintenir la visite. Cet accord devra nous être renvoyé par mail dans les plus bref délais.

Bien cordialement


${generateBookingDetail(metaData)}
`;
}

const generateMessage48HoursParaPablo = (metaData) => {
  let adults = 0;
  metaData.bookings.forEach(booking => {
    if (!!booking['tour-adult'] && parseInt(booking['tour-adult']) > 0) {
      adults += parseInt(booking['tour-adult']);
    }
  });

  return `
  Bonjour,

Le nombre minimum de participants pour la visite "${metaData.tour_name_email}" ${metaData.tour_start_time} n'a pas été atteint. Seulement ${adults} adulte(s) ont réservé. La visite va être reprogrammée sauf accord exceptionnel de votre part de maintenir la visite. Cet accord devra nous être renvoyé par mail dans les plus bref délais.

Bien cordialement

${JSON.stringify(metaData)}


${generateBookingDetail(metaData)}
`;
}

const generateMessage1HourAnd24Hours = (metaData) => {
  return `
  Confirmation de la visite "${metaData.tour_name_email}" ${metaData.tour_start_time}
  
Total des participants: ${getTotalTravelers(metaData)}
Liste des participants: 
   ${getTravelersList(metaData)}
N.B : N'oubliez pas :
- Arriver 5 min en avance au point de RDV
- Avoir un petit flacon de gel hydroalcoolique à disposition pendant la visite 
- Sensibiliser les participants aux commentaires TripAdvisor à la fin de la visite."





${generateBookingDetail(metaData)}
  `;
}

const getTotalTravelers = (metaData) => {
  let count = 0;
  metaData.bookings.forEach(booking => {
    count += booking.traveller_first_name.length;
  });
  return count;
}

const getTravelersList = (metaData) => {
  let list = '';
  let count = 0;
  metaData.bookings.forEach(booking => {
    booking.traveller_first_name.forEach((first_name, index) => {
      count++;
      list += `               ${count})  ${first_name}, ${booking.traveller_last_name[index]}
    `;
    });
  });
  return list;
}


const generateBookingDetail = (metaData) => {
  let body = `

  ========================================================================================
    Détail des réservations: 
    Min: ${metaData.notify_when_reaches_min}
  ========================================================================================
  `;

  metaData.bookings.forEach(booking => {
    body += `
      adultes: ${booking['tour-adult']}   - jeunes: ${booking['tour-student']}   - enfants: ${booking['tour-children']}   - etudiants: ${booking['tour-female']}   - libre: ${booking['tour-infant']}   - pre ado: ${booking['tour-male']}
      Code de coupon: ${booking['coupon-code']}

      Coordonnées:
         prénom: ${booking.first_name}
         nom: ${booking.last_name}
         e-mail: ${booking.email}
         téléphone: ${booking.phone}
         pays: ${booking.country}
      
      Voyageurs:
    `;
    booking.traveller_first_name.forEach((first_name, index) => {
      body += `         ${first_name}, ${booking.traveller_last_name[index]}
    `;
    });
    body += `
    ========================================================================================
    `;
  });

  const current_time = moment().format("YYYY-MM-DD HH:mm:ss")

  body += `

          
          Notification du système de visite

          Note: this email has been generate at ${current_time} (YYYY-MM-DD HH:mm:ss)
  `;
  return body;
}

const senddToNotifyMinTravelers = (metaData) => {
  const keys = Object.keys(metaData);
  keys.forEach(async (key) => {
    if (metaData[key].send_notify_min || metaData[key].send_notify_1 || metaData[key].send_notify_24 || metaData[key].send_notify_48) {
      const subjectSubfix = ` - "${metaData[key].tour_name_email}" ${metaData[key].tour_start_time}`;
      if (metaData[key].send_notify_min) {
        await sendEmailToGuide(metaData[key], `${SUBJECT_MIN}${subjectSubfix}`, generateMessageMin(metaData[key]));
      }
      if (metaData[key].send_notify_1 || metaData[key].send_notify_24) {
        await sendEmailToGuide(metaData[key], `${SUBJECT_1_HOUR_24_HOURS}${subjectSubfix}`, generateMessage1HourAnd24Hours(metaData[key]));
      }
      if (metaData[key].send_notify_48) {
        await sendEmailToGuide(metaData[key], `${SUBJECT_48_HOURS}${subjectSubfix}`, generateMessage48Hours(metaData[key]));
      }
    }
  });
}

const generateTestEmail = async (metaData) => {
  await sendEmailToGuide({email_guide: 'tissera.pablo@gmail.com'}, `Test send email from epoktour ${new Date()}`, 'FYI');
}

const emailHandler = {
  senddToNotifyMinTravelers,
  generateTestEmail
}

module.exports = {
  emailHandler
}

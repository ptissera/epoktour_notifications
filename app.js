var mysql = require('mysql');
const util = require('util');
var nodemailer = require('nodemailer');
const { initCheckAndCompleteStatusHandler } = require('./src/init-check-and-complete-status-handler');
const { validateNotificationsHandler } = require('./src/validate-notifications-handler');
const { updateNotificationStatusHandler } = require('./src/update-notification-status-handler');
const { emailHandler } = require('./src/email-handler');

var conn = mysql.createConnection({
  host: "localhost",
  port: 3306,
  user: "root",
  database: "nizo1382_wp199",
  password: "admin123"
});

const runCheckAndNotifications = async() => {
  conn.connect(async (err) => {
      if (err) throw err;
      console.log("Connected!");
      const query = util.promisify(conn.query).bind(conn);
      let metaData = await initCheckAndCompleteStatusHandler.firstCheckAndComplete(query);
      validateNotificationsHandler.checkMinBookingReached(metaData);
      validateNotificationsHandler.check1HourBookingReached(metaData);
      validateNotificationsHandler.check24HourBookingReached(metaData);
      validateNotificationsHandler.check48HourBookingReached(metaData);
      updateNotificationStatusHandler.update(query, metaData);
      emailHandler.senddToNotifyMinTravelers(metaData);
  //    logMetaData(metaData);
      try {  
        conn.end();
      } catch(err) {
        console.log('a ver que paso', err);
      }
  });
};

const logMetaData = (metaData) => {
  const keys = Object.keys(metaData);
  keys.forEach(key => {
    let travelers_no_children = 0;
    let travelers = 0;
    metaData[key].booking.forEach(book => {
        travelers += book.traveller_first_name.length;
        travelers_no_children += book.traveller_first_name.length;
        if (book['tour-children'].length > 0) {
          travelers_no_children = travelers_no_children - parseInt(book['tour-children']);
        }
    });
    metaData[key].total_travelers_no_children = travelers_no_children;
    metaData[key].total_travelers = travelers;
  });
  console.log(metaData);
}

runCheckAndNotifications();

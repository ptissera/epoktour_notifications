var mysql = require('mysql');
const util = require('util');
var nodemailer = require('nodemailer');
const { initCheckAndCompleteStatusHandler } = require('./src/init-check-and-complete-status-handler');
const { validateNotificationsHandler } = require('./src/validate-notifications-handler');

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
      console.log(metaData);
      try {  
        conn.end();
      } catch(err) {
        console.log('a ver que paso', err);
      }
  });
};

runCheckAndNotifications();

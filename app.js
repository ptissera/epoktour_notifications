var mysql = require('mysql');
const util = require('util');
const { initCheckAndCompleteStatusHandler } = require('./src/init-check-and-complete-status-handler');
const { validateNotificationsHandler } = require('./src/validate-notifications-handler');
const { updateNotificationStatusHandler } = require('./src/update-notification-status-handler');
const { emailHandler } = require('./src/email-handler');
const { dbConfig } = require('./src/config');

var conn = mysql.createConnection(dbConfig);

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
      //markToForceReSend(metaData);
      emailHandler.senddToNotifyMinTravelers(metaData);
      //logMetaData(metaData);
      try {  
        conn.end();
      } catch(err) {
        console.log('a ver que paso', err);
      }
  });
};

const markToForceReSend = (metaData) => {
  const keys = Object.keys(metaData);
  const FORCE = { 
    //99: { send_notify_min: true,  send_notify_1: false,  send_notify_24: true, send_notify_48:true},
    //97: { send_notify_min: true,  send_notify_1: false,  send_notify_24: false, send_notify_48:false},
    //94: { send_notify_min: true,  send_notify_1: false,  send_notify_24: false, send_notify_48:true},
    //101: { send_notify_min: true,  send_notify_1: false,  send_notify_24: false, send_notify_48:false},
  //  228: { send_notify_min: false,  send_notify_1: false,  send_notify_24: false, send_notify_48:true},
  };
  keys.forEach(key => {
    if(FORCE[metaData[key].status_id]) {
      metaData[key].send_notify_min =FORCE[metaData[key].status_id].send_notify_min;
      metaData[key].send_notify_1=FORCE[metaData[key].status_id].send_notify_1;
      metaData[key].send_notify_24=FORCE[metaData[key].status_id].send_notify_24;
      metaData[key].send_notify_48=FORCE[metaData[key].status_id].send_notify_48;
    }
  });
}

const logMetaData = (metaData) => {
  const keys = Object.keys(metaData);
  keys.forEach(key => {
    if (metaData[key].package_group_slug !== "sin reserva" && metaData[key].status_id ) {
    console.log(`${metaData[key].status_id} - ${metaData[key].travel_date}`);
    }
  });
}

runCheckAndNotifications();

"use strict";

const ONE_HOUR = 3600000;
const TWO_HOURS = ONE_HOUR * 2;
const MIN_1_HOUR = 3240000 + TWO_HOURS;
const MAX_1_HOUR = 3960000 + TWO_HOURS;
const MIN_24_HOUR = 86040000 + TWO_HOURS;
const MAX_24_HOUR = 86760000 + TWO_HOURS;
const MIN_48_HOUR = 172440000 + TWO_HOURS;
const MAX_48_HOUR = 173160000 + TWO_HOURS;

const checkMinBookingReached = (metaData) => {
  const keys = Object.keys(metaData);
  keys.forEach((key) => {
    if (!metaData[key].notify_min) {
      let travelers = 0;
      metaData[key].bookings.forEach((book) => {
        if (!!book['tour-adult'] && parseInt(book['tour-adult']) > 0) {
          travelers += parseInt(book["tour-adult"]);
        }
      });
      metaData[key].send_notify_min =
        metaData[key].notify_when_reaches_min <= travelers;
      metaData[key].notify_min = metaData[key].send_notify_min;
    }
  });
};

const check1HourBookingReached = (metaData) => {
  const keys = Object.keys(metaData);
  keys.forEach((key) => {
    if (
      !metaData[key].notify_1 &&
      MIN_1_HOUR <= metaData[key].diff_time &&
      metaData[key].diff_time <= MAX_1_HOUR
    ) {
      let travelers = 0;
      metaData[key].bookings.forEach((book) => {
        travelers += book.traveller_first_name.length;
      });
      metaData[key].send_notify_1 = metaData[key].total_travelers != travelers;
      metaData[key].notify_1 = metaData[key].send_notify_1;
    }
  });
};

const check24HourBookingReached = (metaData) => {
  const keys = Object.keys(metaData);
  keys.forEach((key) => {
    if (
      !metaData[key].notify_24 &&
      MIN_24_HOUR <= metaData[key].diff_time &&
      metaData[key].diff_time <= MAX_24_HOUR
    ) {
      metaData[key].send_notify_24 = true;
      metaData[key].notify_24 = true;
    }
  });
};

const check48HourBookingReached = (metaData) => {
  const keys = Object.keys(metaData);
  keys.forEach((key) => {
    if (
      !metaData[key].notify_48 &&
      MIN_48_HOUR <= metaData[key].diff_time &&
      metaData[key].diff_time <= MAX_48_HOUR
    ) {
      try {
        let travelers = 0;
        metaData[key].bookings.forEach((book) => {
          if (!!book['tour-adult'] && parseInt(book['tour-adult']) > 0) {
            travelers += parseInt(book["tour-adult"]);
          }
        });
        try {
          metaData[key].send_notify_48_comparation = {
            key: key,
            send_notify_48: metaData[key].send_notify_48,
            min: metaData[key].notify_when_reaches_min,
            trav: travelers,
            comparation: metaData[key].notify_when_reaches_min > travelers,
          };
        } catch (error) {
          metaData[key].send_notify_48_error = error;
        }
        metaData[key].send_notify_48 =
          metaData[key].notify_when_reaches_min > travelers;
        metaData[key].notify_48 = metaData[key].send_notify_48;
      } catch (error) {
        metaData[key].send_notify_48_error = error;
      }
    }
  });
};

const validateNotificationsHandler = {
  checkMinBookingReached,
  check1HourBookingReached,
  check24HourBookingReached,
  check48HourBookingReached,
};

module.exports = {
  validateNotificationsHandler,
};

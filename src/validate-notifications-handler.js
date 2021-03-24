'use strict';

const MIN_1_HOUR = 3240000;
const MAX_1_HOUR = 3960000;
const MIN_24_HOUR = 86040000;
const MAX_24_HOUR = 86760000;
const MIN_48_HOUR = 172440000;
const MAX_48_HOUR = 173160000;

const checkMinBookingReached = (metaData) => {
    const keys = Object.keys(metaData);
    keys.forEach(key => {
        if(!metaData[key].notify_min) {
            let travelers = 0;
            metaData[key].bookings.forEach(book => {
                if (parseInt(book['tour-adult']) > 0) {
                  travelers += parseInt(book['tour-adult']);
                }
            });
            metaData[key].send_notify_min = metaData[key].notify_when_reaches_min <= travelers;
            metaData[key].notify_min = metaData[key].send_notify_min;
        }
    });
};

const check1HourBookingReached = (metaData) => {
    const keys = Object.keys(metaData);
    keys.forEach(key => {
        if(!metaData[key].notify_1 && MIN_1_HOUR <= metaData[key].diff_time && metaData[key].diff_time <= MAX_1_HOUR) {
            let travelers = 0;
            metaData[key].bookings.forEach(book => {
                travelers += book.traveller_first_name.length;
            });
            metaData[key].send_notify_1 = metaData[key].total_travelers != travelers;
            metaData[key].notify_1 = metaData[key].send_notify_min;
        }
    });
};


const check24HourBookingReached = (metaData) => {
    const keys = Object.keys(metaData);
    keys.forEach(key => {
        if(!metaData[key].notify_24 && MIN_24_HOUR <= metaData[key].diff_time && metaData[key].diff_time <= MAX_24_HOUR) {
            metaData[key].send_notify_24 = true;
            metaData[key].notify_24 = true;
        }
    });
};

const check48HourBookingReached = (metaData) => {
    const keys = Object.keys(metaData);
    keys.forEach(key => {
        if(!metaData[key].notify_48 && MIN_48_HOUR <= metaData[key].diff_time && metaData[key].diff_time <= MAX_48_HOUR) {
            let travelers = 0;
            metaData[key].bookings.forEach(book => {
                if (parseInt(book['tour-adult']).length > 0) {
                    travelers += parseInt(book['tour-adult']);
                  }
            });
            metaData[key].send_notify_48 = metaData[key].notify_when_reaches_min > travelers;
            metaData[key].notify_48 = metaData[key].send_notify_48;
        }
    });
};

const validateNotificationsHandler = {
    checkMinBookingReached,
    check1HourBookingReached,
    check24HourBookingReached,
    check48HourBookingReached
};

module.exports = {
    validateNotificationsHandler
}
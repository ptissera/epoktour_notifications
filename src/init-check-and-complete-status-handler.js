'use strict';

const moment = require("moment");

const SQL_GET_POSTMETA = `SELECT *
    FROM wp0g_postmeta
    WHERE meta_key='notify_when_reaches_min'
    OR meta_key='email_guide'
    OR meta_key='tour_name_email'
    OR meta_key='tourmaster-tour-option'`;

const SQL_GET_CURRENT_ORDERS = `SELECT tour_id, travel_date, date_format(travel_date, '%Y-%m-%d') travel_date_key, package_group_slug, booking_detail
    FROM wp0g_tourmaster_order
    WHERE DATE(travel_date) >= SUBDATE(CURDATE(),1)
    AND order_status != 'cancel'
    AND order_status != 'pending'
    ORDER BY 1, 2 DESC`;

const SQL_GET_NOTIFICATION_STATUS = `SELECT *, date_format(travel_date, '%Y-%m-%d') travel_date_key FROM wp0g_pg_notification_status
    WHERE travel_date >= SUBDATE(CURDATE(),1)`;

const TOKEN_DATE_EXIST = '"date";s:10:"';
const TOKEN_DATE_NO_EXIST = '"date";s:';
const TOKEN_START_TIME = '"start-time";s:';

const MIN_1_HOUR = 3240000;
const MAX_1_HOUR = 3960000;
const MIN_24_HOUR = 86040000;
const MAX_24_HOUR = 86760000;
const MIN_48_HOUR = 172440000;
const MAX_48_HOUR = 173160000;
const metaDataAllKeys = {};

const loadCurrentOrders = async (query, metaData) => {

    const result = await query(SQL_GET_CURRENT_ORDERS);
    result.forEach(({ tour_id, travel_date, travel_date_key, package_group_slug, booking_detail }) => {
        const key = `${tour_id}_${travel_date_key}_${package_group_slug}`;
        if (!metaData[key]) {
            metaData[key] = {
                tour_id,
                travel_date,
                travel_date_key,
                package_group_slug,
                bookings: [],
                notify_when_reaches_min: 3,
                email_guide: 'maira@pardigital.com.ar',
                tour_name_email: '',
                nuevo: true,
                status_id: 0,
                notify_min: false,
                notify_1: false,
                notify_24: false,
                notify_48: false,
                send_notify_min: false,
                send_notify_1: false,
                send_notify_24: false,
                send_notify_48: false,
                total_travelers_no_children: 0,
                total_travelers: 0

            };
        }
        metaData[key].bookings.push(JSON.parse(booking_detail));
    });
};

const loadPostMeta = async (query, metaData) => {
    const result = await query(SQL_GET_POSTMETA);
    const mapPostMeta = {};
    result.forEach(({ post_id, meta_key, meta_value }) => {
        if (!mapPostMeta[post_id]) {
            mapPostMeta[post_id] = {
                tourmaster_tour_option: '',
                notify_when_reaches_min: 3,
                email_guide: 'maira@pardigital.com.ar',
                tour_name_email: ''
            }
        }
        meta_key = meta_key.split('-').join('_');
        mapPostMeta[post_id][meta_key] = meta_key === 'notify_when_reaches_min' ? parseInt(meta_value) : meta_value;
    });
    const keys = Object.keys(metaData);
    keys.forEach(key => {
        if (mapPostMeta[metaData[key].tour_id]) {
            if (metaDataAllKeys[key]) {
                delete metaDataAllKeys[key];
            }
            metaData[key].notify_when_reaches_min = mapPostMeta[metaData[key].tour_id].notify_when_reaches_min;
            metaData[key].email_guide = mapPostMeta[metaData[key].tour_id].email_guide;
            metaData[key].tour_name_email = mapPostMeta[metaData[key].tour_id].tour_name_email;
            metaData[key].current_time = moment().format("YYYY-MM-DD HH:mm:ss");
            const tour_start_time = `${metaData[key].travel_date_key} ${getTourHour(metaData[key])}`;
            metaData[key].startTimes = moment(tour_start_time).format("YYYY-MM-DD HH:mm:ss");
            metaData[key].tour_start_time = moment(tour_start_time).format("YYYY-MM-DD HH:mm:ss");
            metaData[key].diff_time = moment.utc(metaData[key].tour_start_time).diff(metaData[key].current_time);
        }
    });

    // agrego todos los tours que aun no tienen reservas para saber 48hs antes si envio el email
    const auxKeys = Object.keys(metaDataAllKeys);
    auxKeys.forEach(key => {
        const tour_start_time_string = `${metaDataAllKeys[key].travel_date_key} ${getTourHour(metaDataAllKeys[key])}`;
        const tour_start_time = moment(tour_start_time_string).format("YYYY-MM-DD HH:mm:ss");
        if (moment().diff(metaDataAllKeys[key].travel_date_key) <= 0) {
            metaData[key] = {
                tour_id: metaDataAllKeys[key].tour_id,
                travel_date_key: metaDataAllKeys[key].travel_date_key,
                notify_when_reaches_min: mapPostMeta[metaDataAllKeys[key].tour_id].notify_when_reaches_min,
                email_guide: mapPostMeta[metaDataAllKeys[key].tour_id].email_guide,
                tour_name_email: mapPostMeta[metaDataAllKeys[key].tour_id].tour_name_email,
                current_time: moment().format("YYYY-MM-DD HH:mm:ss"),
                tour_start_time,
                diff_time: moment.utc(metaDataAllKeys[key].tour_start_time).diff(metaDataAllKeys[key].current_time),
                travel_date: moment(metaDataAllKeys[key].travel_date_key).format("YYYY-MM-DD HH:mm:ss"),
                bookings: [],
                package_group_slug: 'sin reserva',
                nuevo: true,
                status_id: 0,
                notify_min: false,
                notify_1: false,
                notify_24: false,
                notify_48: false,
                send_notify_min: false,
                send_notify_1: false,
                send_notify_24: false,
                send_notify_48: false,
                total_travelers_no_children: 0,
                total_travelers: 0
            }
        }
    });
};

const getTourHour = (item) => {
  const matcher = item.package_group_slug.match(/(\d+)[h]((\d)+)?/gm);
  if (matcher) {
     const splited = matcher[0].toLowerCase().split('h')
     return `${splited[0]}:${!!splited[1]?splited[1]:'00'}:00`;
  }
    return '10:00:00';
}

const loadNotificationStatus = async (query, metaData) => {
    const result = await query(SQL_GET_NOTIFICATION_STATUS);
    result.forEach(({ tour_id, travel_date_key, id, notify_min, notify_1, notify_24, notify_48, total_travelers_no_children, total_travelers, package_group_slug }) => {
        const key = `${tour_id}_${travel_date_key}_${package_group_slug}`;
        if (metaData[key]) {
            metaData[key].nuevo = false;
            metaData[key].status_id = id;
            metaData[key].notify_min = notify_min;
            metaData[key].notify_1 = notify_1;
            metaData[key].notify_24 = notify_24;
            metaData[key].notify_48 = notify_48;
            metaData[key].total_travelers_no_children = total_travelers_no_children;
            metaData[key].total_travelers = total_travelers;
        }
    });
};

const initCheckAndCompleteStatusHandler = {
    firstCheckAndComplete: async (query) => {
        let metaData = {}
        await loadCurrentOrders(query, metaData);
        await loadPostMeta(query, metaData);
        await loadNotificationStatus(query, metaData);
        return metaData;
    }
};

module.exports = {
    initCheckAndCompleteStatusHandler
}
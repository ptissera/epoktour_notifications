'use strict';

const SQL_GET_POSTMETA = `SELECT *
    FROM wp0g_postmeta
    WHERE meta_key='notify_when_reaches_min'
    OR meta_key='email_guide'
    OR meta_key='tourmaster-tour-option'`;

const SQL_GET_CURRENT_ORDERS = `SELECT tour_id, travel_date, date_format(travel_date, '%Y-%m-%d') travel_date_key, package_group_slug, booking_detail
    FROM wp0g_tourmaster_order
    WHERE travel_date >= now()
    AND order_status != 'cancel'
    ORDER BY 1, 2 DESC`;

const SQL_GET_NOTIFICATION_STATUS = `SELECT *, date_format(travel_date, '%Y-%m-%d') travel_date_key FROM wp0g_pg_notification_status
    WHERE travel_date >= now()`;

const loadCurrentOrders = async (query, metaData ) => {
    
    const result = await query(SQL_GET_CURRENT_ORDERS);
    result.forEach(({tour_id, travel_date, travel_date_key, package_group_slug, booking_detail}) => {
        const key = `${tour_id}_${travel_date_key}`;
        if (!metaData[key]) {
            metaData[key] = {
                tour_id,
                travel_date,
                travel_date_key,
                package_group_slug,
                booking: [],
                notify_when_reaches_min: 3,
                email_guide: 'maira@pardigital.com.ar',
                nuevo: true,
                status_id:0,
                notify_min: false,
                notify_1: false,
                notify_24: false,
                notify_48: false,
                total_travelers_no_children: 0,
                total_travelers: 0

            };
        }
        metaData[key].booking.push(JSON.parse(booking_detail));
    });
};

const loadPostMeta = async (query, metaData) => {
    const result = await query(SQL_GET_POSTMETA); 
    const mapPostMeta = {};
    result.forEach(({post_id, meta_key, meta_value}) => {
        if (!mapPostMeta[post_id]) {
            mapPostMeta[post_id]={
                tourmaster_tour_option: '',
                notify_when_reaches_min: 3,
                email_guide: 'maira@pardigital.com.ar',
                startTimes: {}
            }
        }
        meta_key = meta_key.split('-').join('_');
        mapPostMeta[post_id][meta_key]= meta_key === 'notify_when_reaches_min' ? parseInt(meta_value) : meta_value;
    });
    fillStartTime(mapPostMeta);
    const keys = Object.keys(metaData);
    keys.forEach(key => {
        const item = metaData[key];
        if (mapPostMeta[item.tour_id]) {
            metaData[key].notify_when_reaches_min = mapPostMeta[item.tour_id].notify_when_reaches_min;
            metaData[key].email_guide = mapPostMeta[item.tour_id].email_guide;
        }
    });
};

const fillStartTime = (mapPostMeta) => {
    const keys = Object.keys(mapPostMeta);
    keys.forEach(key => {
        mapPostMeta[key].startTimes = parseStartTime(key, mapPostMeta[key].tourmaster_tour_option);
    });
};

const parseStartTime = (tour_id, options) => {
    const TOKEN_DATE_EXIST = '"date";s:10:"';
    const TOKEN_DATE_NO_EXIST = '"date";s:';
    const TOKEN_START_TIME = '"start-time";s:';
    let tour_date = '';
    let tour_start_time = '';
    let startTimes = {};
    let i = 0;
    if (options.indexOf(TOKEN_DATE_EXIST) > -1) {
        while(options.indexOf(TOKEN_DATE_EXIST) > -1) {
            options = options.substring(options.indexOf(TOKEN_DATE_EXIST) + TOKEN_DATE_EXIST.length)        
            tour_date = options.slice(0, 10);

            options = options.substring(options.indexOf(TOKEN_START_TIME) + TOKEN_START_TIME.length)
            tour_start_time = options.slice(options.indexOf('"') + 1, 8);

            const start_time_key = `${tour_id}_${tour_date}`;
            startTimes[start_time_key] = tour_start_time;
        }
    } else if (options.indexOf(TOKEN_DATE_NO_EXIST) -1) {
        options = options.substring(options.indexOf(TOKEN_START_TIME) + TOKEN_START_TIME.length)
        tour_start_time = options.slice(options.indexOf('"') + 1, 8);
        if (tour_start_time.length > 0) {
            const start_time_key = `${tour_id}`;
            startTimes[start_time_key] = tour_start_time;
        }
    }
    return startTimes;
};

const loadNotificationStatus = async(query, metaData) => {
    const result = await query(SQL_GET_NOTIFICATION_STATUS);
    result.forEach(({tour_id, travel_date_key, id, notify_min, notify_1, notify_24, notify_48}) => {
        const key = `${tour_id}_${travel_date_key}`;
        metaData[key].nuevo = false,
        metaData[key].status_id = id,
        metaData[key].notify_min = notify_min;
        metaData[key].notify_1 = notify_1;
        metaData[key].notify_24 = notify_24;
        metaData[key].notify_48 = notify_48;
    });
};

const initCheckAndCompleteStatusHandler = {
    firstCheckAndComplete: async(query) => {
        let metaData = {}
        await loadCurrentOrders(query, metaData);
        await loadPostMeta(query, metaData);
        await loadNotificationStatus(query, metaData);
        //console.log(metaData);
    }
};

module.exports = {
    initCheckAndCompleteStatusHandler
}
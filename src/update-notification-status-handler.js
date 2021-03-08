
const update = async(query, metaData) => {

  const keys = Object.keys(metaData);
    keys.forEach(async (key) => {
      let travelers_no_children = 0;
      let travelers = 0;
      metaData[key].bookings.forEach(book => {
          travelers += book.traveller_first_name.length;
          travelers_no_children += book.traveller_first_name.length;
          if (book['tour-children'].length > 0) {
            travelers_no_children = travelers_no_children - parseInt(book['tour-children']);
          }
      });
      if (metaData[key].nuevo) {
        const SQL_CREATE_NOTIFICATION_STATUS = `INSERT INTO wp0g_pg_notification_status (
          tour_id,
          travel_date, 
          package_group_slug, 
          notify_min, 
          notify_1, 
          notify_24, 
          notify_48, 
          total_travelers_no_children, 
          total_travelers)
        VALUES (${metaData[key].tour_id},
        "${metaData[key].travel_date_key }",
        "${metaData[key].package_group_slug}",
        ${metaData[key].notify_min},
        ${metaData[key].notify_1},
        ${metaData[key].notify_24},
        ${metaData[key].notify_48},
        ${travelers_no_children},
        ${travelers})`;
        await query(SQL_CREATE_NOTIFICATION_STATUS);
      } else if (metaData[key].send_notify_min || metaData[key].send_notify_1 || metaData[key].send_notify_24 || metaData[key].send_notify_48) {
        const SQL_UPDATE_NOTIFICATION_STATUS = `UPDATE wp0g_pg_notification_status SET
          notify_min = ${metaData[key].notify_min},
          notify_1 = ${metaData[key].notify_1},
          notify_24 = ${metaData[key].notify_24},
          notify_48 = ${metaData[key].notify_48},
          total_travelers_no_children = ${travelers_no_children},
          total_travelers = ${travelers}
        WHERE id = ${metaData[key].status_id}`;
        await query(SQL_UPDATE_NOTIFICATION_STATUS);
      }
    });
};


const updateNotificationStatusHandler = {
  update
}

module.exports = {
  updateNotificationStatusHandler
}

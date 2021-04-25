const moment = require("moment");
const REGEX_DATE = /{\w:(\d)+:"date";\w:(\d)+:"/;
const REGEX_EXTRA_DATE = /:"extra-date";\w:(\d)+:"/;
const REGEX_EXCLUDE_DATE = /:"exclude-extra-date";\w:(\d)+:"/;
const REGEX_DAY = /:"day";\w:(\d)+:{\w:(\d)+;\w:(\d)+:"/;
const REGEX_MONTH = /:"month";\w:(\d)+:{\w:(\d)+;\w:(\d)+:"/;
const REGEX_YEAR = /:"year";\w:(\d)+:{\w:(\d)+;\w:(\d)+:"/;
const REGEX_GROUP_SLUG = /:"group-slug";\w:(\d)+:"/;
const REGEX_START_TIME = /:"start-time";\w:(\d)+:"/;
const REGEX_END_GROUP = /\w:(\d)+:"select-package-text";\w:(\d)+:"/;

const extractTourValues = (tourTest, results) => {
    let result = {};
    tourTest = extractAttributeValue(tourTest, result, REGEX_DATE, 'date');
    tourTest = extractAttributeValue(tourTest, result, REGEX_DAY, 'day', true);
    tourTest = extractAttributeValue(tourTest, result, REGEX_MONTH, 'month', true);
    tourTest = extractAttributeValue(tourTest, result, REGEX_YEAR, 'year', true);
    tourTest = extractAttributeValue(tourTest, result, REGEX_EXTRA_DATE, 'extraDate', true);
    tourTest = extractAttributeValue(tourTest, result, REGEX_EXCLUDE_DATE, 'excludeDate', true);
    tourTest = extractAttributeValue(tourTest, result, REGEX_GROUP_SLUG, 'groupSlug', true);
    tourTest = extractAttributeValue(tourTest, result, REGEX_START_TIME, 'startTime', true);
    tourTest = extractAttributeValue(tourTest, result, REGEX_GROUP_SLUG, 'groupSlug', false, true);
    tourTest = extractAttributeValue(tourTest, result, REGEX_START_TIME, 'startTime', false, true);
    tourTest = seekEndGroup(tourTest);
    results.push(result);
    return tourTest;
};


const seekEndGroup = (tourTest) => {
    var match = REGEX_END_GROUP.exec(tourTest);
    if (match) {
        const index = match.index + match[0].length;
        tourTest = tourTest.slice(index)
    }
    return tourTest;
}

const extractAttributeValue = (tourTest, result, regex, field, needSplit, needPush) => {
    var match = regex.exec(tourTest);
    if (match) {
        const index = match.index + match[0].length;
        tourTest = tourTest.slice(index)
        const value = tourTest.slice(0,tourTest.indexOf('"'));
        if (value) {
            if (needPush) {
                result[field].push(value);
            } else if (needSplit) {
                result[field]=value.split(',');
            } else {
                result[field]=value;
            }
        } else if (!needPush) {
            if (needSplit) {
            result[field]=[];
            } else {
            result[field]=null;
            }
        }
    }
    return tourTest;
}

const getObject = (text) => {
    let results = [];
    while(REGEX_DATE.exec(text)) {
        text = extractTourValues(text, results);
    }
    return results;
}

const weekdays = {
    1: 'monday',
    2: 'tuesday',
    3: 'wednesday',
    4: 'thursday',
    5: 'friday',
    6: 'saturday',
    7: 'sunday'
}

const extract = (text) => {
    let results = getObject(text);

    const date = moment().add('days', 2);
    let date48 = {
        date: `${date.format('YYYY-MM-DD')}`,
        startTime: [],
        groupSlug: [],
        weekday: weekdays[date.isoWeekday()],
        month: `${date.month() + 1}`,
        year:`${date.year()}` 
    };

    results.forEach(result => {
        if (
            (result.date === date48.date) ||
            (
                result.day.includes(date48.weekday) && 
                result.month.includes(date48.month) && 
                result.year.includes(date48.year) && 
                (!!result.excludeDate || result.excludeDate && !result.excludeDate.includes(date48.date))
            ) || 
            (result.extraDate.includes(date48.date))
            ) {
            date48.startTime.push(...result.startTime);
            date48.groupSlug.push(...result.groupSlug);
        } 

    })
    
    return date48.startTime.length > 0 ? date48 : null;
}

const extractObjectFromPlainText = {
    extract
};

module.exports = {
    extractObjectFromPlainText
}

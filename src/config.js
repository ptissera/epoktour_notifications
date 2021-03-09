const dbConfig = {
    host: "localhost",
    port: 3306,
    user: "root",
    database: "nizo1382_wp199",
    password: "admin123"
};

const mailConfig = {
    service: 'mail.epoktour.fr',
    port: 465,
    secure: true,
    auth: {
        user: 'notify@epoktour.fr',
        pass: '&2oadN+HFtF1'
    },
    tls: {
        // do not fail on invalid certs
        rejectUnauthorized: false
    }
};

module.exports = {
    dbConfig,
    mailConfig
}
module.exports = {
    development: {
        db: 'mongodb://localhost/wo',
        app: {
            name: 'WO Portal'
        },
        smtp: '', //{host: 'smtp_host'} smtp server used for pass reset/newsletter
        recap_pbk: '', //recaptcha public key
        recap_prk: '', //recaptcha private key
        oauth: {
            tokenLife: 3600
        }
    }
};

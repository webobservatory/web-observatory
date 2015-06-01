module.exports = {
    development: {
        db: 'mongodb://localhost/wo',
        app: {
            name: 'WO Portal'
        },
        smtp: '', //{host: 'smtp_host'} smtp server used for pass reset/newsletter
        recap_pbk: '', //recaptcha public key
        recap_prk: '', //recaptcha private key
        port: {},//{http: 80, https: 443},// external ports when port forward is set up, default to listenOn ports if emitted
        listenOn: {http: 3000, https: 3443},// local port
        oauth: {
            tokenLife: 3600
        }
    }
};

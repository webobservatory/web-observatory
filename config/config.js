module.exports = {
    development: {
        db: 'mongodb://localhost/wo',
        app: {
            name: 'WO Portal'
        },
        smtp: {host: 'smtp.ecs.soton.ac.uk'}, //smtp server used for pass reset/newsletter
        recap_pbk: '6LfwcOoSAAAAACeZnHuWzlnOCbLW7AONYM2X9K-H', //recaptcha public key
        recap_prk: '6LfwcOoSAAAAAGFI7h_SJoCBwUkvpDRf7_r8ZA_D', //recaptcha private key
        facebook: {
            clientID: "", //clientID
            clientSecret: "", //clientSecret
            callbackURL: "" //http://localhost:3000/auth/facebook/callback
        },
        port: {},//{http: 80, https: 443},// external ports when port forward is set up, default to listenOn ports if emitted
        listenOn: {http: 3000, https: 3443},// local port
        oauth: {
            tokenLife: 3600
        }
    }
};

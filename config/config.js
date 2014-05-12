module.exports = {
    development: {
        db: 'mongodb://localhost/wo',
        app: {
            name: 'WO Portal'
        },
        smtp: 'smtp.ecs.soton.ac.uk', //smtp server used for pass reset/newsletter
        recap_pbk: '6LfwcOoSAAAAACeZnHuWzlnOCbLW7AONYM2X9K-H', //recaptcha public key
        recap_prk: '6LfwcOoSAAAAAGFI7h_SJoCBwUkvpDRf7_r8ZA_D', //recaptcha private key
        facebook: {
            clientID: "", //clientID
            clientSecret: "", //clientSecret
            callbackURL: "" //http://localhost:3000/auth/facebook/callback
        },
        oauth: {
            tokenLife: 3600
        }
    }
};

module.exports = {
    development: {
        db: 'mongodb://localhost/wo',
        app: {
            name: 'WO Portal'
        },
        smtp: "",//smtp server used for pass reset/newsletter
        recap_pbk:"",//recaptcha public key
        recap_prk:"",//recaptcha private key
        facebook: {
            clientID: "",//clientID
            clientSecret: "",//clientSecret
            callbackURL: ""//http://localhost:3000/auth/facebook/callback
        }
    }
};

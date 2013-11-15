module.exports = {
    development: {
        db: 'mongodb://localhost/wo',
        app: {
            name: 'Web Observatory'
        },
        facebook: {
            clientID: "clientID",
            clientSecret: "clientSecret",
            callbackURL: "http://localhost:3000/auth/facebook/callback"
        }
    },
    production: {
        db: process.env.MONGOLAB_URI || process.env.MONGOHQ_URL,
        app: {
            name: 'Web Observatory'
        },
        facebook: {
            clientID: "clientID",
            clientSecret: "clientSecret",
            callbackURL: "{{production callbackURL}}"
        }
    }
};

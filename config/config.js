module.exports = {
    development: {
        db: 'mongodb://localhost/eins',
        app: {
            name: 'EINS Portal'
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
            name: 'EINS Portal'
        },
        facebook: {
            clientID: "clientID",
            clientSecret: "clientSecret",
            callbackURL: "{{production callbackURL}}"
        }
    }
};

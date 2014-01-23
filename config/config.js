module.exports = {
    development: {
        db: 'mongodb://localhost/wo',
        app: {
            name: 'SUWO Portal'
        },
        facebook: {
            clientID: "clientID",
            clientSecret: "clientSecret",
            callbackURL: "http://localhost:3000/auth/facebook/callback"
        }
    },
    production: {
        db: process.env.MONGOLAB_URI || 'mongodb://web-001.ecs.soton.ac.uk',
        app: {
            name: 'SUWO Portal'
        },
        facebook: {
            clientID: "clientID",
            clientSecret: "clientSecret",
            callbackURL: "{{production callbackURL}}"
        }
    }
};

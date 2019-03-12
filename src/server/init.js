/**
 * Created by xgfd on 11/01/2016.
 */
SyncedCron.add({
    name: 'Pull remote collections',
    schedule: function (parser) {
        // parser is a later.parse object
        return parser.text('every 1 hour');
    },
    job: pullRemoteColls
});

SyncedCron.add({
    name: 'Datasets/Apps connection test',
    schedule: function (parser) {
        // parser is a later.parse object
        return parser.text('every 12 hour');
    },
    job: checkCon
});

Meteor.startup(function () {
    let settings = Meteor.settings;

    //create admin
    if (!settings.admin) {
        settings.admin = {name: 'admin', username: 'admin', email: 'admin@webobservatory.org', password: 'admin'};
    } else {
        settings.admin = {name: 'admin', username: 'admin', email: 'admin@webobservatory.org', password: settings.admin.password};
    }

    if (!Accounts.findUserByUsername(settings.admin.username)) {
        let xgfdId = Accounts.createUser({
            profile: {
                name: settings.admin.name
            },
            username: settings.admin.username,
            email: settings.admin.email,
            password: settings.admin.password
        });

        Roles.removeUserFromRoles(xgfdId, ["individual"]);
        Roles.addUserToRoles(xgfdId, ["admin"]);
    }

    Meteor.call('nicolaslopezj_roles_migrate');

    // 1. Set up stmp
    //   your_server would be something like 'smtp.gmail.com'
    //   and your_port would be a number like 25

    if (settings.smtp) {
        process.env.MAIL_URL = encodeURIComponent(settings.smtp);
    }

    // Add Facebook configuration entry

    if (settings.facebook) {
        ServiceConfiguration.configurations.update(
            {"service": "facebook"},
            {
                $set: {
                    "appId": settings.facebook.appId,
                    "secret": settings.facebook.secret
                }
            },
            {upsert: true}
        );
    }

    // Add GitHub configuration entry
    if (settings.github) {
        ServiceConfiguration.configurations.update(
            {"service": "github"},
            {
                $set: {
                    "clientId": settings.github.clientId,
                    "secret": settings.github.secret
                }
            },
            {upsert: true}
        );
    }

    // Set up LDAP.
    // Overwrite this function to produce settings based on the incoming request
    LDAP.generateSettings = function (request) {
        let username = request.username,
            domain = username.split('@')[1];

        let ldaps = orion.dictionary.get('ldap.ldap'),
            ldapConfig;

        if (ldaps) {
            ldapConfig = ldaps.filter(v => v.domain === domain)[0];
            ldapConfig.whiteListedFields = ldapConfig.whiteListedFields.split(/,\s*/);
            ldapConfig.autopublishFields = ldapConfig.autopublishFields ? ldapConfig.autopublishFields.split(/,\s*/) : ldapConfig.whiteListedFields;
            delete ldapConfig.domain;
        }

        return ldapConfig;
    };

    LDAP.bindValue = function (username, isEmailAddress, serverDn) {
        return ((isEmailAddress) ? username.split('@')[0] : username) + '@' + serverDn;
    };

    LDAP.filter = function (isEmailAddress, usernameOrEmail) {
        return '(&(cn=' + ((isEmailAddress) ? usernameOrEmail.split('@')[0] : usernameOrEmail) + ')(objectClass=user))';
    };

    LDAP.logging = false;

    Accounts.onCreateUser(function (options, user) {
        // console.log(options, user);
        let profile = options.profile || {};

        if (!profile.name) {
            profile.name = profile.displayName || options.username;
        }

        user.profile = profile;
        // console.log(user);
        return user;
    });

    // Get remote apps and datasets
    // pullRemoteColls();
    // checkCon();
    SyncedCron.start();
});

/**
 * Created by xgfd on 11/01/2016.
 */

Meteor.startup(function () {
    // 1. Set up stmp
    //   your_server would be something like 'smtp.gmail.com'
    //   and your_port would be a number like 25

    process.env.MAIL_URL = 'smtp://' +
            //encodeURIComponent(your_username) + ':' +
            //encodeURIComponent(your_password) + '@' +
        encodeURIComponent(Meteor.settings.smtp);

    // 2. Format the email
    //...

    // 3.  Send email when account is created
    //...
});

var User = require('../../app/models/user');
var nodemailer = require("nodemailer");
var crypto = require('crypto');
var hash = require('./hash');

var smtpTransport = nodemailer.createTransport("SMTP", {
    service: "Gmail",
    auth: {
        user: "soton.wo@gmail.com",
        pass: "webobservatory"
    }
});

module.exports.forgotPass = function(email, reset_path, cb) {
    User.findOne({
        'email': email
    }, function(err, user) {
        if (err)
            return cb(err);
        crypto.randomBytes(32, function(ex, buf) {
            var tk = buf.toString('hex');
            user.reset = {
                token: tk,
                time_stamp: new Date()
            };
            user.save(function(err) {
                if (err)
                    return cb(err);
                var mailOptions = {
                    from: "Soton Web Observatory <wo_noreply@ecs.soton.ac.uk>", // sender address
                    to: (email === 'xgfd@admin.com' ? 'xinxinbird@gmail.com' : email),
                    subject: "Password reset", // Subject line
                    //text: "Hello world ✔", // plaintext body
                    html: 'Click here to <a href="' + reset_path + '?tk=' + tk + '">reset your password</a>.' // html body
                };
                smtpTransport.sendMail(mailOptions, cb);
            });
        });
    });
};

module.exports.resetPass = function(tk, password, cb) {

    User.findOne({
        'reset.token': tk
    }, function(err, user) {
        if (err)
            return cb(err);
        if (!user)
            return cb({
                message: 'Token expired'
            });

        var past_hour = Math.abs(new Date() - user.reset.time_stamp) / 1000 / 60 / 60;

        if (past_hour > 2)
            return cb({
                message: 'Token expired'
            });

        hash(password, function(err, salt, hash) {
            if (err)
                return cb(err);
            user.salt = salt;
            user.hash = hash;
            user.reset = undefined;
            user.save(function(err, user) {
                if (err)
                    return cb(err);
                cb(null, user);
            });
        });
    });
};

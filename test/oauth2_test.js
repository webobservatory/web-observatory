var mongoose = require('mongoose'),
    User = require('../app/models/user'),
    AccessToken = require('../app/models/accesstoken'),
    RefreshToken = require('../app/models/refreshtoken'),
    Client = require('../app/models/client');

var env = process.env.NODE_ENV || 'development',
    config = require('../config/config')[env];
var client_name = process.argv[2],
    client_secret = process.argv[3];
mongoose.connect(config.db);

var client = new Client({
    name: client_name,
    clientSecret: client_secret
});

client.save(function(err, client) {
    if (err) return console.log(err);
    console.log("New client - %s:%s", client._id, client.clientSecret);
});

AccessToken.remove({}, function(err) {
    if (err) return console.log(err);
    console.log('Access token cleared');
});

RefreshToken.remove({}, function(err) {
    if (err) return console.log(err);
    console.log('Refresh token cleared');
});

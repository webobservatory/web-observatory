var async = require('async'),
    fs = require('fs'),
    mongoose = require('mongoose'),
    config = require('../config/config').development;

mongoose.connect(config.db);
var models_dir = __dirname + '/../app/models';
fs.readdirSync(models_dir).forEach(function(file) {
    if (file[0] === '.') return;
    require(models_dir + '/' + file);
});
var User = require('../app/models/user'),
    Etry = require('../app/models/entry');

Etry.find({},function(err,entries){
  async.map(entries, function(entry, cb){
    User.findOne({email:entry.publisher}, function(err, user){
      entry.publisher_name = user.username || (user.firstName ? user.firstName + ' ':'') + (user.lastName ? user.lastName:'');
      entry.save(cb);
    });
  }, function(err, results){console.log(err);});
});

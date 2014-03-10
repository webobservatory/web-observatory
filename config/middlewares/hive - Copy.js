var hive = require('node-hive');

var server = hive.for({server:'http://jxt0.ecs.soton.ac.uk:9038'});

server.fetch('select * from spinn3r limit 1', function(err, data){
  console.log(err);
  console.log(data);
});

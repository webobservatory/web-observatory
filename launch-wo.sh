export PATH=/opt/local/bin:/opt/local/sbin:/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin
export NODE_PATH=/usr/lib/nodejs:/usr/lib/node_modules:/usr/share/javascript
# set to home directory of the user Meteor will be running as
export PWD=/home/wo
export HOME=/home/wo
# leave as 127.0.0.1 for security
export BIND_IP=127.0.0.1
# the port nginx is proxying requests to
export PORT=4000
# this allows Meteor to figure out correct IP address of visitors
export HTTP_FORWARDED_COUNT=1
# MongoDB connection string using todos as database name
export MONGO_URL=mongodb://localhost:27017/wo
# The domain name as configured previously as server_name in nginx
export ROOT_URL=https://dev-001.ecs.soton.ac.uk
# optional JSON config - the contents of file specified by passing "--settings" parameter to meteor command in development mode
# export METEOR_SETTINGS= '{"public": {"environment": "prod"}, "github": {"clientId": "", "secret": ""}, "facebook": {"appId": "", "secret": ""} }' 

# this is optional: http://docs.meteor.com/#email
# commented out will default to no email being sent
# replace USERNAME and PASS by your username and password there
# export MAIL_URL=smtp://USERNAME:PASS@smtp.mailgun.org
# alternatively install "apt-get install default-mta" and uncomment:
export MAIL_URL=smtp://localhost
exec node /home/wo/bundle/main.js >> /home/wo/wo.log

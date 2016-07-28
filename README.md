# Web Observatory Deployment Guide
Meteor apps can be deployed using [mupx](https://github.com/arunoda/meteor-up/tree/mupx). The guide below shows how to deploy web observatory manually.

First install Nginx, MongoDB and Nodejs. Currently Meteor (1.4.5) works with Node v4.4.x and MongoDB v3.2.

## Nginx settings

An annotated configuration file `wo` and SSL certificate `wo.pem` and key `wo.key` can be found under `nginx`. Please refer to the configuration file for more details. Set `ROOT_URL` to the public URL of your host.

On Ubuntu copy `wo` to `/etc/nginx/sites-available` and create a soft link in `/etc/nginx/sites-enabled`. Check whether the configuration is valid using `nginx -t`.

    sudo cp nginx/wo /etc/nginx/sites-available
    sudo ln -s /etc/nginx/sites-available/wo /etc/nginx/sites-enabled/wo
    sudo nginx -t

Then copy SSL cert/key files to `/etc/nginx/ssl`

    sudo cp nginx/wo.* /etc/nginx/ssl

## Meteor settings

Meteor settings are available in a Upstart script `wo.conf`. For security the script is run under a normal user `wo`. To make it work you need to add the user `wo` first.

    sudo adduser --disabled-login wo
    sudo cp wo.conf /etc/init

In the settings given by `METEOR_SETTINGS`, if `public.environment` is dev, then some fake data will be loaded to the MongoDB database.

## Start WO

Extract `build/wo.tar.gz` to `/home/wo` and then start WO following `/home/wo/bundle/README`. Note that the same settings of wo.conf should be used.

    sudo cp build/linux_64/wo.tar.gz /home/wo
    (cd /home/wo && sudo tar -zxf wo.tar.gz && cd bundle/programs/server && sudo npm install)
    sudo start wo

## Upgrade from Previous WO

### Export data from a previous WO

Edit `migrate/export/config.js` and set `from` to the source MongoDB address. Then do

    cd migrate
    npm install
    node migrate.js

Exported data can be found at `import/private`.

### Import

At `migrate/import`, set `MONGO_URL` to the MongoDB address, and run the meteor app.

    export MONGO_URL=mongodb://localhost:27017/wo
    meteor reset
    meteor

After this you can start your WO normally.

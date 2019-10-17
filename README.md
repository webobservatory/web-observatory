# Web Observatory Development and Deployment Guide (updated Oct 2019)

This is a guide for developing and building updated Web Observatory. For compatibility reasons it is highly recommended to use Docker to run the platform.

Pre-requisites:

- Docker

## Build base WO docker image

Create development docker image **wo:dev**:

    cd docker
    docker build -t wo:dev .

## Run in development mode (using meteor)

Change into **src** folder, create a docker container with that image, and run `bash` in that container:

    cd ../src
    docker run --rm -it \
        -v "$PWD":/home/docker/wo-src \
        -w /home/docker/wo-src \
        -p 3000:3000 wo:dev bash

Then:

    meteor npm install
    meteor

You should see WebObservatory on http://locahost:3000

|           ![wo-dev](docs/wo-dev-screenshot.png)            |
| :--------------------------------------------------------: |
| _Web Observatory running in development mode on port 3000_ |

## Build for production

Using base WO docker image, change into root folder of the project and run (add location of build folder):

    docker run --rm -it \
        -v "$PWD"/src:/home/docker/wo-src \
        -v "$PWD"/build:/home/docker/build \
        -w /home/docker/wo-src \
        -p 3000:3000 wo:dev bash

Once the container has started, run:

    meteor npm install
    meteor build ../build/linux_64/ --architecture=os.linux.x86_64

That should create new **wo.tar.gz** bundle in **build/linux_64**

## Deploy WO bundle

Start mongo (has to be version 3.6) in Docker. Create folders for data persistence (mongo/db) and for restoring data from backup (wo-backup, optional):

    docker run --rm -d --name womongo \
        --restart=unless-stopped \
        -v "$PWD"/mongo/db:/data/db \
        -v "$PWD"/wo-backup:/wo-backup \
        -p 27017:27017 \
        mongo:3.6

Unpack wo.tar.gz:

    tar xvf wo-src.tar.gz && cd bundle

Run Web Observatory:

    docker run --name wodocker --restart=unless-stopped -d \
        -v "$PWD":/bundle \
        -p 4000:4000 \
        --link womongo:mongo \
        -e ROOT_URL=http://example.com \
        -e PORT=4000
        -e MONGO_URL=mongodb://mongo:27017/wo
        -e METEOR_SETTINGS='{"public": {"environment": "prod"}, "admin": {"password": "secret"}}' \
        -w /bundle \
        nodesource/jessie:4.4.4 \
        bash -c '(cd programs/server && npm install) && node main.js'

Change the following to match your environment:

- Change `ROOT_URL` to your deployment domain name
- Change admin password under `METEOR_SETTINGS`

If you choose to run WO behind nginx reverse proxy, update nginx configuration to the following:

    location / {
          client_max_body_size 100m;
          proxy_http_version  1.1;
          proxy_set_header    Upgrade $http_upgrade;
          proxy_set_header    Connection "upgrade";
          proxy_pass http://localhost:4000;
          proxy_set_header Host $host;
          proxy_set_header X-Real-IP $remote_addr;
          proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
          proxy_set_header X-Forwarded-Proto $scheme;
          proxy_connect_timeout       600;
          proxy_send_timeout          600;
          proxy_read_timeout          600;
          send_timeout                600;
    }

    location /sockjs/ {
      proxy_http_version 1.1;
      proxy_set_header Upgrade $http_upgrade;
      proxy_set_header Connection "upgrade";
      proxy_pass "http://localhost:4000/sockjs/";
    }

## Dumping and restoring database

Dump:
  
 docker exec -it womongo bash
mongodump -d wo -o /wo-backup/wo-dump-1

Restore:

    docker exec -it womongo bash
    mongorestore --db wo /wo-backup/wo

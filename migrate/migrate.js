/**
 * Created by xgfd on 13/01/2016.
 */
"use strict";

let path = '../app/private/';

let sync = require('synchronize'),
    {from, to} = require('./config'),
    MongoClient = require('mongodb').MongoClient,
    crypto = require('crypto'),
    enc_alg = 'aes256',
    fs = require('fs');

MongoClient.connect(from, function (err, fromDb) {
    if (err) {
        throw err;
    }

    sync.fiber(function () {
        //migrate users
        console.log('exporting users ...');
        let Clients = fromDb.collection('clients'),
            Users = fromDb.collection('users'),
            users = syncFind(Users, {});

        users = users.map(user=>userTrans(user, Clients));

        fs.writeFile(path + 'users', JSON.stringify(users, null, 2), (err)=> {
            if (err) {
                throw err;
            }
        });

        //migrate datasets
        console.log('exporting datasets ...');

        let Entries = fromDb.collection('entries'),
            datasets = syncFind(Entries, {type: 'dataset'});

        datasets = datasets.map(datasetTrans);

        fs.writeFile(path + 'datasets', JSON.stringify(datasets, null, 2), (err)=> {
            if (err) {
                throw err;
            }
        });
        //migrate apps
        console.log('exporting apps ...');
        let apps = syncFind(Entries, {type: 'visualisation'});

        apps = apps.map(appTrans);

        fs.writeFile(path + 'apps', JSON.stringify(apps, null, 2), (err)=> {
            if (err) {
                throw err;
            }
        });

        fromDb.close();
    });
});

function syncFind(col, query) {
    let result = col.find(query);

    sync(result, 'toArray');
    return result.toArray();
}

//migrate users helper
function userTrans(user, Clients) {

    let meteorUser = {username: null, profile: {}, email: null};

    meteorUser.username = user.username || user.email;
    meteorUser.email = user.email;
    meteorUser.profile.name = user.firstName + ' ' + user.lastName;

    if (user.org) {
        meteorUser.profile.organisation = user.org;
    }

    if (user.clients) {
        let clients = user.clients;

        clients = clients.map(function (clientId) {
            let clients = syncFind(Clients, {_id: clientId}),
                {clientSecret, name} = clients[0];
            return {clientId, clientSecret, name};
        });

        meteorUser.profile.clients = clients;
    }

    return meteorUser;
}

function datasetTrans(dataset) {
    let meteorDataset = {
        name: null,
        description: null,
        creator: null,
        publisher: null,
        datePublished: null,
        dateModified: null,
        keywords: [],
        license: null,
        aclMeta: true,
        aclContent: false,
        metaWhiteList: [],
        contentWhiteList: [],
        distribution: []
    };

    meteorDataset.name = dataset.name;
    meteorDataset.description = dataset.description;
    meteorDataset.publisher = dataset.publisher;
    meteorDataset.datePublished = dataset.pubdate;
    meteorDataset.dateModified = dataset.modified;
    meteorDataset.keywords = dataset.kw;

    if (Array.isArray(dataset.canView)) {
        dataset.canView.shift();
    }

    if (Array.isArray(dataset.canAccess)) {
        dataset.canAccess.shift();
    }

    meteorDataset.aclMeta = dataset.opVis;
    meteorDataset.aclContent = dataset.opAcc;
    meteorDataset.metaWhiteList = dataset.canView;
    meteorDataset.contentWhiteList = dataset.canAccess;
    meteorDataset.license = dataset.lice;

    let dist = {url: null, fileFormat: null, online: null};
    dist.url = dataset.url;
    dist.fileFormat = dataset.querytype;
    dist.online = dataset.alive;
    dist.instruction = dataset.queryinfo;

    if (dataset.auth && dataset.auth.user) {
        dist.profile = {};
        dist.profile.username = dataset.auth.user;
        let decipher = crypto.createDecipher(enc_alg, dataset.url);
        decipher.update(dataset.auth.encpwd, 'hex', 'utf8');
        dist.profile.pass = decipher.final('utf8');
    }

    meteorDataset.distribution.push(dist);

    return meteorDataset;
}

function appTrans(app) {
    let meteorApp = {
        name: null,
        description: null,
        url: null,
        github: null,
        online: true,
        creator: null,
        publisher: null,
        datePublished: null,
        dateModified: null,
        keywords: [],
        license: null,
        aclMeta: true,
        aclContent: false,
        metaWhiteList: [],
        contentWhiteList: []
    };

    meteorApp.name = app.name;
    meteorApp.description = app.description;
    meteorApp.url = app.url;
    meteorApp.publisher = app.publisher;
    meteorApp.license = app.lice;
    meteorApp.github = app.git;
    meteorApp.online = app.alive;
    meteorApp.datePublished = app.pubdate;
    meteorApp.dateModified = app.modified;
    meteorApp.keywords = app.kw;

    if (Array.isArray(app.canAccess)) {
        app.canAccess.shift();
    }

    if (Array.isArray(app.canView)) {
        app.canView.shift();
    }

    meteorApp.aclMeta = app.opVis;
    meteorApp.aclContent = app.opAcc;
    meteorApp.metaWhiteList = app.canView;
    meteorApp.contentWhiteList = app.canAccess;

    if (app.related) {
        meteorApp.isBasedOnUrl = app.related.split(',');
    }

    return meteorApp;
}

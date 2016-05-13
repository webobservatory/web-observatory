/**
 * Created by xgfd on 14/01/2016.
 */
Apps = new Mongo.Collection('apps');
Datasets = new Mongo.Collection('datasets');
Clients = new Mongo.Collection('clients');
Roles = new Mongo.Collection('roles');

function importData(path) {
    console.log('reading from ' + path);
    let data = JSON.parse(Assets.getText(path));
    console.log('importing ' + path);
    data.forEach(_import[path]);
}

let _import = {apps: importApp, users: importUser, datasets: importDataset};

function importUser(user) {
    let userId;
    try {
        userId = Accounts.createUser(user);
        Roles.insert({userId, roles: ["individual"]});
    }
    catch (e) {
        if (e.error === 403) {//username already exists
            console.log(`${user.username} already exists`)
            userId = Accounts.findUserByEmail(user.email)._id;
        } else {
            console.log(e);
            throw e;
        }
    }

    if (user.profile && user.profile.clients) {
        let clients = user.profile.clients;
        clients.forEach(c => {
            let {clientId, clientSecret, name} = c;
            Clients.upsert({_id: clientId}, {
                $set: {
                    _id: clientId,
                    publisher: userId,
                    clientSecret,
                    name,
                    datePublished: new Date()
                }
            });
        });
    }
}


function emailToUser(email) {
    let user = Accounts.findUserByEmail(email);
    if (!user) {
        console.log(email);
    }
    return user || {};
}

function emailToId(email) {
    return emailToUser(email)._id;
}

function emailToName(email) {
    return emailToUser(email).username;
}

function transform(doc) {
    doc.license = doc.license || 'no-license';
    doc.description = doc.description;
    //publisher email->_id
    let user = emailToUser(doc.publisher);
    doc.publisher = user._id;
    doc.publisherName = user.username;

    //dates String->Date
    doc.datePublished = new Date(doc.datePublished);
    doc.dateModified = new Date(doc.dateModified);

    //acl whitelist
    doc.metaWhiteList = doc.metaWhiteList.map(emailToId);
    doc.contentWhiteList = doc.contentWhiteList.map(emailToId);
    return doc;
}

function datasetTrans(dataset) {
    return transform(dataset);
}

function importDataset(dataset) {

    if (dataset.distribution[0].fileFormat !== 'File') {
        dataset = datasetTrans(dataset);
        try {
            Datasets.upsert({name: dataset.name}, {$set: dataset});
        }
        catch (e) {
            console.error(dataset);
            console.error(e);
        }
    } else {
        return false;
    }
}

function appTrans(app) {
    app = transform(app);

    if (app.isBasedOnUrl) {
        app.isBasedOnUrl = app.isBasedOnUrl.map(name => {
            let ds = Datasets.findOne({name});
            if (!ds) {
                console.error('App: ' + app.name + ', dataset ' + name + ' not found');
                return null;
            } else {
                return ds._id;
            }
        }).filter(id => id !== null);
    }
    return app;
}

function importApp(app) {
    app = appTrans(app);
    try {
        Apps.upsert({name: app.name}, {$set: app});
    }
    catch (e) {
        console.error(app);
        console.error(e);
    }
}

['users', 'datasets', "apps"].forEach(importData);

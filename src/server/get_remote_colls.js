/**
 * Created by xgfd on 10/05/2016.
 */

function normaliseUrl(url) {
    //prepend http:// if abscent
    if (url.indexOf('http') !== 0) {
        url = 'http://' + url;
    }

    //append / if abscent
    if (url[url.length - 1] !== '/') {
        url += '/';
    }
    return url;
}

function origin(url, name, doc) {
    return `${url}${name}/${doc._id}`;
}

function linkToRemote(url, name, local) {
    let remote = DDP.connect(url),
        col = new Mongo.Collection(name, {connection: remote});

    col.find().observe({
        added(doc) {
            doc.origin = origin(url, name, doc);
            //TODO rewrite id refs using url as prefix
            delete doc._id;
            delete doc.isBasedOnUrl;
            delete doc.comments;
            local.insert(doc);
        },
        removed(doc) {
            let origin = origin(url, name, doc);
            local.remove({origin});
        },
        changed(doc, oldDoc) {
            let origin = origin(url, name, oldDoc);
            local.remove({origin});

            doc.origin = origin(url, name, doc);
            delete doc._id;
            delete doc.isBasedOnUrl;
            local.insert(doc);
        }
    });
    return col;
}

function regRemoteColls(remote_name, urls, local) {
    return urls.reduce((map, url) => {
        url = normaliseUrl(url);
        if (!map[url]) {
            map[url] = linkToRemote(url, remote_name, local);
        }
        return map;
    }, {});
}

function updateSub(remoteColls) {
    Object.keys(remoteColls)
        .map(url => remoteColls[normaliseUrl(url)])
        .forEach(col => {
            if (col) {
                let name = col._name,
                    remote = col._connection;
                remote.subscribe(name);
            }
        });
}

let woUrls = orion.config.get('wo_urls');
let remoteColls = {};

if (woUrls) {
    RemoteApps.remove({});
    RemoteDatasets.remove({});

    remoteColls[RemoteDatasets.pluralName] = regRemoteColls('datasets', woUrls, RemoteDatasets);
    remoteColls[RemoteApps.pluralName] = regRemoteColls('apps', woUrls, RemoteApps);
}

pullRemoteColls = function () {
    [RemoteApps, RemoteDatasets]
        .map(coll=>remoteColls[coll.pluralName])
        .forEach(updateSub);
};

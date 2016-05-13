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

function urlToCol(url, name, local) {
    let remote = DDP.connect(url),
        col = new Mongo.Collection(name, { connection: remote });
    col.find().observe({
        added(doc) {
            doc.url = `${url}${name}/${doc._id}`;
            //TODO rewrite id refs using url as prefix
            delete doc._id;
            delete doc.isBasedOnUrl;
            delete doc.comments;
            // console.log(doc);
            local.insert(doc);
        }
    });
    remote.subscribe(name);
    return col;
}

function regRemoteColls(name, urls, init, local) {
    return urls.reduce((map, url) => {
        url = normaliseUrl(url);
        if (!map[url]) {
            map[url] = urlToCol(url, name, local);
        }
        return map;
    }, init);
}

function updateSub(local, remoteColls) {
    local.remove({});
    Object.keys(remoteColls)
        .map(url => remoteColls[normaliseUrl(url)])
        .forEach(col => {
            let name = col._name,
                remote = col._connection;

            remote.subscribe(name);
        });
}

let woUrls = orion.dictionary.get('wo.wo_urls');
let remoteDatasetColls = {},
    remoteAppColls = {};

if (woUrls) {
    remoteDatasetColls = regRemoteColls('datasets', woUrls, remoteDatasetColls, RemoteDatasets);
    remoteAppColls = regRemoteColls('apps', woUrls, remoteAppColls, RemoteApps);
}

retrieveRemoteColls = function () {
    if (woUrls) {
        console.log('update from remote collections');
        updateSub(RemoteDatasets, remoteDatasetColls);
        updateSub(RemoteApps, remoteAppColls);
    }
};


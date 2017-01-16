/**
 * Created by xgfd on 08/06/2016.
 */

import {RESTCompose, absPath} from './utils'

function toREST(url, entry) {
    return {
        href: `${url}/${entry._id}`,
        rel: 'item',
        method: 'GET',
        name: entry.name
    }
}

function lstHeaders(req) {
    let headers = {
        title: req.path.split('/')[1],
        opensearch: `${absPath(req)}?query={queryString}`
    };
    return headers;
}

function lstLinks(req) {
    let collName = req.path.split('/')[1],
        coll = Mongo.Collection.get(collName);
    let selector = {};

    try {
        let queryString = req.query.query || '{}';
        selector = JSON.parse(queryString);
    }
    catch (err) {
        throw new Meteor.Error(500, 'Invalid query syntax', err);
    }

    let entries = [];

    if (coll) {
        extendOr(selector, viewsDocumentQuery(req.user));
        entries = coll.find(selector).map(toREST.bind(null, absPath(req)));
    }
    return entries;
}

function entryHeaders(req) {
    let collName = req.path.split('/')[1],
        coll = Mongo.Collection.get(collName);
    let id = req.params.id;

    let headers = {};

    if (coll && id) {
        let selector = {_id: id};
        extendOr(selector, viewsDocumentQuery(req.user));
        let entry = coll.findOne(selector);
        let pubProperties = ['name', 'description', 'license', 'creator', 'publisherName', 'datePublished', 'dateModified', 'keywords', 'votes', 'downbvotes', 'datasetTimeInterval', 'spatial', 'github', 'url'];

        pubProperties.forEach(p=> {
                if (entry[p]) {
                    headers[p] = entry[p]
                }
            }
        );

        let distributions = entry.distribution;
        if (distributions) {
            headers.distribution = distributions.map(d=> {
                delete d.file;
                delete d.profile;
                delete d.url;
                return d;
            })
        }
    }

    return headers;
}

function entryLinks(req) {
    let collName = req.path.split('/')[1],
        coll = Mongo.Collection.get(collName);
    let id = req.params.id;
    let thisUrl = absPath(req);

    let links = [
        { href: thisUrl.substring(0, thisUrl.lastIndexOf('/')), rel: 'collection', method: 'GET'},
        { href: thisUrl + "/provenance", rel: "http://www.w3.org/ns/prov#has_provenance", method: 'GET', anchor: thisUrl }
    ];

    if (coll && id) {
        let selector = {_id: id};
        extendOr(selector, viewsDocumentQuery(req.user));
        let entry = coll.findOne(selector);
        if (entry && entry.distribution) {
            let distributions = entry.distribution;
            links = links.concat(distributions.map(d=>({
                href: `${thisUrl}/${d._id}?query={queryString}&collection={MongoDBCollection}&options{MongoDBQueryOptions}`,
                rel: 'distribution',
                method: 'GET',
                fileFormat: d.fileFormat
            })));
        }
    }

    return links;
}

function entryProvHeaders(req) {
    let prov = require('./prov');
    let doc = prov.document();

    // prefixes
    let schema = doc.addNamespace('schema', 'http://schema.org/');
    let foaf = doc.addNamespace('foaf', 'http://xmlns.com/foaf/0.1/');
    let wo = doc.addNamespace('wo', 'http://webobvervatory.org/ns');
    let wos = doc.addNamespace('wo-soton', 'https://webobservatory.soton.ac.uk/');

    // retrieving the collection
    let collName = req.path.split('/')[1],
        coll = Mongo.Collection.get(collName);
    let id = req.params.id;

    if (coll && id) {
        let selector = {_id: id};
        extendOr(selector, viewsDocumentQuery(req.user));
        let entry = coll.findOne(selector);
        const schemaTypes = { datasets: 'Dataset', apps: 'WebApplication'};
        let entry_properties = ['prov:type', `schema:${schemaTypes[collName]}`];
        let pubProperties = ['name', 'description', 'datePublished', 'dateModified'];
        pubProperties.forEach(p => {
        if (entry[p]) {
            entry_properties.push(...[`schema:${p}` , entry[p]]);
        }
        });
        let entry_id = `wo-soton:${collName}/${id}`;
        doc.entity(entry_id, entry_properties);

        let agent_id = `wo-soton:accounts/${entry['publisher']}`
        doc.agent(agent_id, ['prov:type', 'foaf:OnlineAccount', 'prov:label', entry['publisherName']]);
        doc.wasAttributedTo(entry_id, agent_id);
    }

    return doc.scope.getProvJSON();
}


let getEntryLst = RESTCompose(lstHeaders, lstLinks),
    getEntry = RESTCompose(entryHeaders, entryLinks),
    getEntryProvenance = function (req, res) {
        try {
            let provenance = entryProvHeaders(req);
            res.json(provenance);
        }
        catch (err) {
            res.json(err);
        }
    };

export {getEntryLst, getEntry, getEntryProvenance}

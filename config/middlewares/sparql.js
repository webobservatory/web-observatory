var http = require('http');
var domain = "web-001.ecs.soton.ac.uk";
var selectURL = '/openrdf-workbench/repositories/wo/query';
var updateURL = '/openrdf-workbench/repositories/wo/update';
var async = require('async');
var logger = require('../../app/util/logger');

var queryBuilders = {
    datasets: buildSELECTDataset,
    visualisations: buildSELECTVis
};

var updateQryBuilders = {
    visualisations: buildUpdateVis,
    datasets: buildUpdateDataset

};

function getPrefix() {
    var void_ = "PREFIX void: <http://rdfs.org/ns/void#>",
        schema = "PREFIX schema: <http://schema.org/>",
        dcterms = "PREFIX dcterms: <http://purl.org/dc/terms/>",
        wo = "PREFIX wo: <http://wo.ecs.soton.ac.uk/>",
        xsd = "PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>",
        rdf = "PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>",
        foaf = "PREFIX foaf: <http://xmlns.com/foaf/0.1/>";
    return void_ + ' ' + schema + ' ' + dcterms + ' ' + wo + ' ' + xsd + ' ' + rdf + ' ' + foaf + ' ';
}

function buildSELECTDataset(visible, readable) {
    return buildSELECT('datasets', visible, readable);
}

function buildSELECTVis(visible) {
    return buildSELECT('visualisations', visible, null);
}

function buildSELECT(type, visible) {


    var qmap = {
        visualisations: 'rdf:type schema:WebPage. OPTIONAL {?entry schema:isBasedOnUrl ?source.} VALUES ?type {"Visualisation"} ',
        datasets: 'wo:readable ?readable; rdf:type schema:Dataset. '
    };

    var visibleUnion = '?entry wo:visible "true"^^xsd:boolean. ';
    if (visible && visible.length > 0) {
        var values = '';
        for (i = 0; i < visible.length; i++)
            values += '<' + visible[i] + '> ';

        visibleUnion = '{{' + visibleUnion + '} UNION {?entry wo:visible "false"^^xsd:boolean. VALUES ?entry { ' + values + '}}} ';
    }


    var myprefix = getPrefix();
    var query =
        'SELECT DISTINCT ?title ?url ?type ?desc ?email ?readable ?source ' +
        'WHERE { ' +
        '?entry schema:name ?title; ' +
        'schema:url ?url; ' +
        'schema:additionalType ?type; ' +
        'schema:description ?desc; ' +
        'schema:publisher ?publisher; ' +
        qmap[type] +
        visibleUnion +
        '?publisher schema:email ?email. ' +
        '}';
    query = myprefix + ' ' + query;
    return query;
}

function buildUpdateVis(data) {
    return buildUpdate('visualisations', data);
}

function buildUpdateDataset(data) {
    return buildUpdate('datasets', data);
}

function buildUpdate(type, data) {
    //?title ?url ?type ?desc ?email ?readable ?source
    var typemap = {
        visualisations: 'schema:WebPage',
        datasets: 'schema:Dataset'
    };

    var title = data.title,
        url = data.url,
        base_class = typemap[type],
        addType = data.addType,
        desc = data.desc,
        email = data.email,
        username = data.username,
        visible = data.visible === 'false' ? '"false"^^xsd:boolean' : '"true"^^xsd:boolean',
        readable = data.readable === 'false' ? '"false"^^xsd:boolean' : '"true"^^xsd:boolean',

        prefix = getPrefix(),
        graph = 'wo:void',
        date = new Date(),
        offset = date.getTimezoneOffset(),

        sign = '+';

    if (offset < 0) {
        sign = '-';
        offset = offset * -1;
    }

    var h = parseInt(offset / 60),
        min = offset % 60;

    date = date.getFullYear() + '-' + date.getMonth() + '-' + date.getDate(); //yyyy-mm-dd
    date = '\'' + date + sign + h + ':' + min + '\'' + '^^xsd:date'; //'yyyy-mm-dd+hh:mm'^^xsd:date

    var entry = '<' + url + '>';

    //class
    //general info.
    //acl
    var query =
        entry + ' rdf:type ' + base_class + '; ' +
        'schema:additionalType "' + addType + '"; ' +
        'schema:name "' + title + '"; ' +
        'schema:description "' + desc + '"; ' +
        'schema:datePublished ' + date + '; ' +
        'schema:url <' + url + '>; ' +
        'schema:publisher _:pb; ' +
        (type === 'visualisations' && data.source ?
        'schema:isBasedOnUrl "' + data.source + '"; ' :
        '') +
        'wo:visible ' + visible + '; ' +
        'wo:readable ' + readable + '. ' +
        (data.creator ? entry + ' schema:creator _:cr. _:cr rdf:type schema:Person; ' + ' schema:name "' + data.creator + '". ' :
        '') +
        '_:pb rdf:type schema:Person; ' +
        (username ? 'schema:name "' + username + '"; ' : '') +
        'schema:email "' + email + '". ';
    query = prefix + ' INSERT DATA { GRAPH ' + graph + ' { ' + query + ' } } ';

    return query;
}
/**
 *bindings: results from sparql query
 *readable: list of urls of datasets that are readable to the current user
 */

function tableEntries(bindings, readable) {
    var rows = [];
    for (i = 0; i < bindings.length; i++) {
        var binding = bindings[i];
        var row = {};
        for (var key in binding) {
            row[key] = binding[key].value;
        }
        //readable to the current user? set readable to true
        if (readable &&
            row.readable === 'false' &&
            readable.indexOf(row.url) != -1) {
            row.readable = 'true';
        }
        rows.push(row);
    }
    return rows;
}


function httpQuery(opts, cb) {
    var req = http.request(opts, function(res) {
        logger.info("Response: " + res.statusCode);

        switch (res.statusCode) {
            case 404:
                cb({
                    message: 'Service not available'
                });
                break;
            case 502:
                cb({
                    message: 'Service not available'
                });
                break;
            case 500:
                cb({
                    message: 'Service timeout'
                });
                break;
            case 200:
                var data = "";
                res.on('data', function(chunk) {
                    data += chunk;
                });
                res.on('end', function() {
                    cb(false, data);
                });
                break;
            default:
                cb({
                    message: 'Status code: ' + res.statusCode
                });
        }
    }).on('error', function(err) {
        logger.error(err.message);
        cb(err);
    });
    req.end();
}

module.exports.SPARQLGetContent = function(type, visible, readable, cb) {
    var query = queryBuilders[type](visible);
    logger.info('Select query: ' + query);
    var opts = {
        port: 8080,
        host: domain,
        path: selectURL + '?query=' + encodeURIComponent(query),
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Accept': 'application/sparql-results+json'
        }
    };

    httpQuery(opts, function(err, data) {
        if (err)
            return cb(err);
        data = JSON.parse(data);
        var rows = [];
        if (data.results) {
            var bindings = data.results.bindings;
            if (bindings.length == 1 &&
                bindings[0]['error-message']) {
                return cb({
                    message: bindings[0]['error-message'].value
                });
            }
            rows = tableEntries(bindings, readable);
            cb(false, rows);
        } else {
            cb({
                message: 'No entry retrieved'
            });
        }
    });
};

module.exports.SPARQLUpdateContent = function(type, data, cb) {

    var query = updateQryBuilders[type](data);
    logger.info('Update query: ' + query);
    var opts = {
        method: 'post',
        port: 8080,
        host: domain,
        path: updateURL + '?update=' + encodeURIComponent(query),
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Accept': 'application/sparql-results+json'
        }
    };

    httpQuery(opts, function(err, data) {
        if (err)
            return cb(err);
        if (data) {
            data = JSON.parse(data);
            var message = data.results.bindings[0]['error-message'].value;
            cb({
                'message': message
            });
        } else
            cb(false);
    });
};


module.exports.SPARQLUpdateStatus = function(data, cb) {
    var uri = '<' + data.url + '>',
        newuri = '<' + data.newurl + '>',
        title = data.title,
        creator = data.creator,
        desc = data.desc,
        visible = data.visible,
        readable = data.readable;

    var insert = '',
        del = '',
        where = 'WHERE {OPTIONAL {' + uri + ' wo:visible ?v}' + ' OPTIONAL {' + uri + ' wo:readable ?r}}';

    if (typeof readable !== 'undefined') {
        insert += uri + ' wo:readable ' + readable + '. ';
        del += uri + ' wo:readable ?r. ';
    }

    if (typeof visible !== 'undefined') {
        insert += uri + ' wo:visible ' + visible + '. ';
        del += uri + ' wo:visible ?v. ';
    }


    insert = 'INSERT {' + insert + '} ';
    del = 'DELETE {' + del + '} ';
    var query = getPrefix() + 'WITH wo:void ' + del + insert + where;

    logger.info('Update status query: ' + query);
    var opts = {
        method: 'post',
        port: 8080,
        host: domain,
        path: updateURL + '?update=' + encodeURIComponent(query),
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Accept': 'application/sparql-results+json'
        }
    };

    httpQuery(opts, function(err, data) {
        if (err)
            return cb(err);
        if (data) {
            data = JSON.parse(data);
            var message = data.results.bindings[0]['error-message'].value;
            cb({
                'message': message
            });
        } else
            cb(false);
    });
};


module.exports.getDataset = function(cb) {
    var query =
        'SELECT DISTINCT ?title ?url ?class ?addType ?email ?readable ?visible' +
        'WHERE { ' +
        '?entry schema:name ?title; ' +
        'schema:url ?url; ' +
        'schema:additionalType ?addType; ' +
        'rdf:type ?class; ' +
        'schema:publisher ?publisher. ' +
        'VALUES ?class {schema:Dataset schema:WebPage}. ' +
        '?publisher schema:email ?email. ' +
        'OPTIONAL {?entry wo:visible ?visible} ' +
        'OPTIONAL {?entry wo:readable ?readable} ' +
        '} ' +
        'ORDER BY ?email';
    query = getPrefix() + query;
    var opts = {
        port: 8080,
        host: domain,
        path: selectURL + '?query=' + encodeURIComponent(query),
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Accept': 'application/sparql-results+json'
        }
    };

    httpQuery(opts, function(err, data) {
        if (err)
            return cb(err);
        data = JSON.parse(data);
        var rows = [];
        if (data.results) {
            var bindings = data.results.bindings;
            if (bindings.length == 1 &&
                bindings[0]['error-message']) {
                return cb({
                    message: bindings[0]['error-message'].value
                });
            }
            rows = tableEntries(bindings);
            cb(false, rows);
        } else {
            cb({
                message: 'No entry retrieved'
            });
        }
    });
};

module.exports.query = function(url, query, output, cb) {

    var content_types = {
        xml: 'application/sparql-results+xml',
        json: 'application/sparql-results+json',
        csv: 'application/sparql-results+json', //some endpoints don't correctly response to /text/csv, use json then convert to csv
        tsv: 'text/tab-separated-values'
    };

    var parsed = require('url').parse(url);

    var opts = {
        hostname: parsed.hostname,
        port: parsed.port,
        path: parsed.pathname + '?query=' + encodeURIComponent(query),
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Accept': content_types[output] || 'application/sparql-results+json'
        }
    };
    httpQuery(opts, cb);
};


module.exports.removeByIds = function(urls, cb) {
    var del = '',
        values = '';
    for (i = 0; i < urls.length; i++) {
        values += '<' + urls[i] + '> ';
    }
    values = 'VALUES ?url {' + values + '}';


    var where = 'WHERE { ?dataset ?p ?o; schema:url ?url. ' + values + ' }';

    del = 'DELETE { ?dataset ?p ?o.} ';
    var query = getPrefix() + 'WITH wo:void ' + del + where;

    logger.info('Remove datasets query: ' + query);
    var opts = {
        method: 'post',
        port: 8080,
        host: domain,
        path: updateURL + '?update=' + encodeURIComponent(query),
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Accept': 'application/sparql-results+json'
        }
    };

    //async.waterfall([],function(err,result){});
    httpQuery(opts, function(err, data) {
        if (err)
            return cb(err);
        if (data) {
            data = JSON.parse(data);
            var message = data.results.bindings[0]['error-message'].value;
            cb({
                'message': message
            });
        } else {
            query = ' with wo:void delete {?person ?p ?o} where {?person a schema:Person; ?p ?o. filter (!bound(?ds)) optional {?ds a schema:Dataset. ?ds ?pre ?person}}';
            query = getPrefix() + query;
            opts.path = updateURL + '?update=' + encodeURIComponent(query);
            httpQuery(opts, function(err, data) {
                if (err)
                    return cb(err);
                if (data) {
                    data = JSON.parse(data);
                    var message = data.results.bindings[0]['error-message'].value;
                    cb({
                        'message': message
                    });
                } else {
                    cb(false);
                }
            });
        }
    });
};

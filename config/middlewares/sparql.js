var http = require('http');
var xmlParser = require('xml2js').parseString;

var domain = "web-001.ecs.soton.ac.uk";
var selectURL = '/openrdf-workbench/repositories/wo/query';
var updateURL = '/openrdf-workbench/repositories/wo/update';

var queryBuilders = {
    datasets: buildSELECTDataset,
    visualisations: buildSELECTVis
};

var resultBuilders = {

    datasets: datasetRows,
    visualisations: visRows
};

var updateQryBuilders = {
    visualisations: buildUpdateVis,
    datasets: buildUpdateDataset

};

function getPrefix() {
    var void_ = "PREFIX void: <http://rdfs.org/ns/void#>",
        dcterms = "PREFIX dcterms: <http://purl.org/dc/terms/>",
        wo = "PREFIX wo: <http://wo.ecs.soton.ac.uk/>",
        xsd = "PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>",
        rdf = "PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>",
        foaf = "PREFIX foaf: <http://xmlns.com/foaf/0.1/>";
    return void_ + " " + dcterms + " " + wo + " " + xsd + " " + rdf + " " + foaf;
}

function buildSELECTDataset(visible, readable) {
    return buildSELECT('datasets', visible, readable);
}

function buildSELECTVis(visible) {
    return buildSELECT('visualisations', visible, null);
}

function buildSELECT(type, visible, readable) {

    var varmap = {
        visualisations: '?source',
        datasets: '?type'
    };

    var qmap = {
        visualisations: 'rdf:type wo:visualisation; dcterms:source ?source; dcterms:identifier ?url. ',
        datasets: 'rdf:type void:Dataset; void:feature ?type; void:sparqlEndpoint ?url. '
    };

    var visibleUnion = '?entry wo:visible "true"^^xsd:boolean.';
    if (visible && visible.length > 0) {
        var values = '';
        for (i = 0; i < visible.length; i++)
            values += visible[i] + ' ';

        visibleUnion = '{{' + visibleUnion + '} UNION {?entry wo:visible "false"^^xsd:boolean. VALUES ?entry { ' + values + '}}}';
    }


    var myprefix = getPrefix();
    var query =
        'SELECT DISTINCT ?title ' + varmap[type] + ' ?url ?desc ?readable ?email ' +
        'WHERE { ' +
        '?entry dcterms:title ?title; ' +
        'dcterms:description ?desc; ' +
        'wo:readable ?readable; ' +
        qmap[type] +
        visibleUnion +
        ' OPTIONAL { ?entry dcterms:publisher ?publisher. ?publisher foaf:mbox ?email}' +
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
//console.log(JSON.stringify(data));
    var map = {
        visualisations: 'source',
        datasets: 'type'
    };

    var title = data.title,
        typOrsrc = data[map[type]],
        url = data.url,
        desc = data.desc,
        email = data.email,
        username = data.username,
        visible = data.visible ? '"true"^^xsd:boolean' : '"false"^^xsd:boolean',
        readable = data.readable ? '"true"^^xsd:boolean' : '"false"^^xsd:boolean',
        publisher = 'wo:' + email.replace('@', '-');

    var prefix = getPrefix(),
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

    var entry = 'wo:' + url.split('://')[1]; //remove protocl

    var query = entry;

    query += ' dcterms:title "' + title + '"; ';

    query += 'dcterms:description "' + desc + '"; ';

    query += 'dcterms:issued ' + date + '; ';

    query += 'wo:visible ' + visible + '; ';

    query += 'wo:readable ' + readable + '; ';


    if (type === 'datasets') {
        query += 'rdf:type void:Dataset; ';
        query += 'void:sparqlEndpoint <' + url + '>; ';
        query += 'void:feature "' + typOrsrc + '"' + '; ';
    }

    if (type === 'visualisations') {
        query += 'rdf:type wo:visualisation; ';
        query += 'dcterms:identifier <' + url + '>; ';
        query += 'dcterms:source "' + typOrsrc + '"; ';
    }

    query += 'dcterms:publisher ' + publisher + '. ';

    //publisher
    query += publisher + ' rdf:type foaf:Person; ';

    if (username) {
        query += 'foaf:name "' + username + '"; ';
    }

    query += ' foaf:mbox <mailto:' + email + '>. ';

    query = prefix + ' INSERT DATA { GRAPH ' + graph + ' { ' + query + ' } } ';

    return query;
}

function datasetRows(bindings) {
    //console.log(JSON.stringify(bindings));
    var rows = {};
    for (i = 0; i < bindings.length; i++) {
        var binding = bindings[i].binding;
        //console.log(JSON.stringify(binding));
        var title = binding[0].literal,
            type = binding[1].literal,
            url = binding[2].uri,
            desc = binding[3].literal,
            readable = binding[4].literal,
            publisherEmail = null;

        if (binding.length > 5)
            publisherEmail = binding[5].uri.toString().split(':')[1];
        var row = {
            title: title,
            type: type,
            url: url,
            desc: desc,
            readable: readable,
            publisher: publisherEmail
        };
        rows[i] = row;
    }
    return rows;
}


function visRows(bindings) {
    var rows = {};
    for (i = 0; i < bindings.length; i++) {
        var binding = bindings[i].binding;

        var title = binding[0].literal,
            source = binding[1].literal,
            url = binding[2].uri,
            desc = binding[3].literal,
            publisherEmail = null;

        if (binding.length > 5)
            publisherEmail = binding[5].uri.toString().split(':')[1];
        var row = {
            title: title,
            source: source,
            url: url,
            desc: desc,
            publisher: publisherEmail
        };
        rows[i] = row;
    }
    return rows;
}


module.exports.SPARQLGetContent = function(type, user, render) {

    var visible = user.access;

    var query = queryBuilders[type](visible);
    //console.log(query);
    var opts = {
        port: 8080,
        host: domain,
        path: selectURL + '?query=' + encodeURIComponent(query) + '&content-type=application/sparql-results+json',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Accept': 'application/sparql-results+json'
        }
    };

    var req = http.request(opts, function(res) {
        console.log("Got response: " + res.statusCode);
        var data = "";
        res.on('data', function(chunk) {
            data += chunk;
        });
        res.on('end', function() {
            xmlParser(data, function(err, result) {
                //console.log(JSON.stringify(result.sparql));
                var rows = {};
                if (typeof result.sparql.results !== 'undefined') {
                var bindings = result.sparql.results[0].result;
                rows = resultBuilders[type](bindings);
            }
            render(rows);
            });
        });
    }).on('error', function(e) {
    console.log("Got error: " + e.message);
});
req.end();
};

module.exports.SPARQLUpdateContent = function(type, data, render) {

    var query = updateQryBuilders[type](data);
    //console.log(query);
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

    var req = http.request(opts, function(res) {
        console.log("Got update response: " + res.statusCode);
        var data = "";
        res.on('data', function(chunk) {
            data += chunk;
        });
        res.on('end', function() {
            xmlParser(data, function(err, response) {
                if (response) {
                  console.log(JSON.stringify(response.sparql.results[0].result[0]));
                    var message = response.sparql.results[0].result[0];
                    //console.log(message);
                    render(message);

                } else
                    render('Dataset added');

            });
        });
    }).on('error', function(e) {
        console.log("Got error: " + e.message);
        render(e.message);
    });

    req.end();

};

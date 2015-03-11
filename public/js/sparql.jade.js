var endpointURL = '';
var endpointID = '';
var format = 'browse';
var defaultGraphURI = '';
var namespaces = {
    'http://www.w3.org/2002/07/owl#': 'owl',
    'http://www.w3.org/2001/XMLSchema#': 'xsd',
    'http://www.w3.org/2000/01/rdf-schema#': 'rdfs',
    'http://www.w3.org/1999/02/22-rdf-syntax-ns#': 'rdf',
    'http://xmlns.com/foaf/0.1/': 'foaf',
    'http://purl.org/dc/elements/1.1/': 'dc',
    'http://dbpedia.org/property/': 'dbpedia2',
    'http://dbpedia.org/': 'dbpedia',
    'http://www.w3.org/2004/02/skos/core#': 'skos',
    'http://rdfs.org/sioc/ns#': 'sioc'
};

function toPrefixesText(namespaces) {
    var result = '';
    for (var uri in namespaces) {
        result += 'PREFIX ' + namespaces[uri] + ': <' + uri + '> ';
    }
    return result;
}

function toPrefixesHTML(namespaces) {
    var result = '';
    for (var uri in namespaces) {
        result += 'PREFIX ' + namespaces[uri] + ': &lt' + uri + '&gt\n';
    }
    return result;
}

function start() {
    setPrefixes(toPrefixesHTML(namespaces));
}

function setPrefixes(prefixes) {
    $('#prefixestext').html(prefixes);
}

function submitQuery() {
    format = $('#selectoutput').val();
    var query = toPrefixesText(namespaces) + ' ' + $('#querytext').val().replace('\n', ' ');
    console.log(query);
    $('input[name="query"]').val(query);
    var busy = $('<div class="alert alert-info"> Executing query ...</div>');

    setResult(busy);
    $('#queryform').submit();

    /*

        $.get('/query?query=' + encodeURIComponent(query) + '&id=' + encodeURIComponent(endpointID) + '&format=' + format, function(data)
        {
            var res;
            if (data.error)
            {
                res = '<div class="alert alert-warning">' + data.error + '</div>';
            }
            else
            {
                if (format === 'browse')
                {

                    var bindings = data.results.bindings;
                    res = '<h2>Results</h2> <table class="table table-striped">';
                    var tem = bindings[0];
                    var th = '<thead><tr>';
                    for (var key in tem)
                    {
                        th += '<th>' + key + '</th>';
                    }
                    th += ' </tr></thead>';

                    res += th;
                    res += '<tbody>';
                    for (i = 0; i < bindings.length; i++)
                    {
                        var binding = bindings[i];
                        var line = '<tr>';
                        for (var key in binding)
                        {
                            line += '<td>' + binding[key].value + '</td > ';
                        }
                        line += ' </tr>';
                        res += line;
                    }

                    res += ' </tbody></table> ';
                }

                if (format === 'json')
                {
                    res = '<a href="' + data.path + '">Download results as JSON</a>';
                }

                if (format === 'csv')
                {
                    res = '<a href="' + data.path + '">Download results as CSV</a>';
                }
            }

            res = $(res);
            setResult(res);
        });
        */
}

function resetQuery() {
    $("#querytext").val("SELECT * \nWHERE {\n  ?subject rdf:type ?class\n} LIMIT 10");
}

function setResult(node) {
    display(node, 'result');
}

function display(node, dsp_id) {
    var dsp = $('#' + dsp_id);
    if (!dsp) {
        alert('ID not found: ' + whereID);
        return;
    }
    dsp.empty();
    if (node === null) return;
    dsp.append(node);
}


$(document).ready(function() {
    resetQuery();
    $('#send').bind('click', function(event) {
        submitQuery();
        event.preventDefault();
    });
    $('#reset').bind('click', function(event) {
        resetQuery();
        event.preventDefault();
    });
    $(".tp").tooltip();
    start();
});

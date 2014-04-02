$(document).ready(function() {
    $('#optogl').bind('click', function() {
        $('#optogl span').toggleClass('glyphicon-chevron-down glyphicon-chevron-up');
    });
    $("input,select,textarea").not("[type=submit]").jqBootstrapValidation();
    $('#dsTils').autocomplete({
        source: '/nametags/dataset'
    });

    $('#dbtest').bind('click', function(event) {
        contest();
    });

    function contest() {
        var protocol = {
            sparql: 'http',
            hive: 'http',
            mongodb: 'mongodb',
            mysql: 'mysql',
            postgres: 'postgres'
        };
        event.preventDefault();
        var data = {};
        $('#conted').removeClass('glyphicon-remove glyphicon-ok');
        data.url = $('#adddata input[name=url]').val() || $('#adddata input[name=url]').attr('placeholder');
        data.typ = $('#adddata p.form-control-static[name=querytype]').text().toLowerCase();
        if (data.url.split('://')[0] !== protocol[data.typ])
            return alert("Dataset type doesn't mathch URL protocol");
        if (data.typ.indexOf('sql') !== -1) return alert('Dataset not yet supported');
        $.get('/contest?url=' + data.url + '&typ=' + data.typ, function(data, textStatus) {
            //console.log(data);
            if (data) {
                //alert('Connection failed');
                $('#conted').addClass('glyphicon-remove');
                con_succeed = false;
            } else {
                //alert('Connection succeeded');
                $('#conted').addClass('glyphicon-ok');
                con_succeed = true;
            }
        });
    }
});

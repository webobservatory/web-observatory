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
        data.user = $('#adddata input[name=user]').val() || $('#adddata input[name=user]').attr('placeholder');
        data.pwd = $('#adddata input[name=pwd]').val();
        console.log(data);
        $.get('/contest', data, function(data, textStatus) {
            console.log(data);
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

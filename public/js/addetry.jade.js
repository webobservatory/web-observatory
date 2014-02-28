var con_succeed = -1;
$(document).ready(function() {
    $('#private').bind('click', function() {
        var $this = $(this);
        // $this will contain a reference to the checkbox   
        if ($this.prop('checked')) {
            // the checkbox was checked 
            $('#visible').fadeIn();
        }

        if (!$this.prop('checked')) {
            $('#visible').fadeOut();
            $('#visible input').prop('checked', false);
        }
    });
    $("input,select,textarea").not("[type=submit]").jqBootstrapValidation();
    $('#optogl').bind('click', function() {
        $('#optogl span').toggleClass('glyphicon-chevron-down glyphicon-chevron-up');
    });

    $('#dsTils').autocomplete({
        source: '/nametags/dataset'
    });

    $('#submit').bind('click', function(event) {
        if (con_succeed === -1)
            contest();
        if (con_succeed)
            $('#adddata').submit();
        else
            alert('Please check the url of your entry');
        event.preventDefault();
    });

    $('#dbtest').bind('click', function(event) {
        contest();
    });

    function contest() {
        var protocol = {
            mongodb: 'mongodb',
            sparql: 'http',
            mysql: 'mysql',
            postgres: 'postgres'
        };
        event.preventDefault();
        var data = {};
        $('#conted').removeClass('glyphicon-remove glyphicon-ok');
        data.url = $('#adddata input[name=url]').val();
        data.typ = $('#adddata select[name=querytype]').val().toLowerCase();
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

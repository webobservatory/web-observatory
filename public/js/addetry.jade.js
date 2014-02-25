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

    $('#dbtest').bind('click', function(event) {
        event.preventDefault();
        var data = {};
        $('#conted').removeClass('glyphicon-remove glyphicon-ok');
        data.url = $('#adddata input[name=url]').val();
        data.typ = $('#adddata select[name=querytype]').val().toLowerCase();
        if (data.typ !== 'sparql') return alert('Dataset not yet supported');
        $.get('/contest?url=' + data.url + '&typ=' + data.typ, function(data, textStatus) {

            if (data) {
                //alert('Connection failed');
                $('#conted').addClass('glyphicon-remove');
            } else {
                //alert('Connection succeeded');
                $('#conted').addClass('glyphicon-ok');
            }
        });
    });

});

function openQueryForm(title, id, type) {
    if (title != '#') {
        $('#query-frame').load('/queries/' + type.toLowerCase().trim() + '.html', function() {
            setEndpointURL(title, id, null);
            start();
        });
        $('html, body').animate({
            scrollTop: $('#query-frame').offset().top
        }, 1000);
    }
}

function dspBtn() {
    var checked = $('input.req:checkbox:checked');
    if (checked.length !== 0)
        $('#req').fadeIn();
    else
        $('#req').fadeOut();
}

function requestAcc() {
    var checked = $('input.req:checkbox:checked');
    $('#reqform').append(checked);
    $('#reqform').submit();
}

$(document).ready(function() {
    $('.tp').tooltip();
    $('#display').dataTable();

    $('a.tp').bind('click', function(event) {
        openQueryForm($(this).attr('href'), $(this).attr('id'), $(this).attr('interface'));
        event.preventDefault();
    });

    $('#submit').bind('click', function(event) {
        $('#adddata').submit();
        event.preventDefault();
    });

    $('#private').bind('click', function() {
        var $this = $('#private');
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

    $('input.req:checkbox').bind('click', dspBtn);
    $('#req').bind('click', requestAcc);

});

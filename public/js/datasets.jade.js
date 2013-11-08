function openQueryForm(url, type) {
    if (url != '#') {
        $('#query-frame').load('/queries/' + type.toLowerCase().trim() + '.html', function() {
            setEndpointURL(url, null);
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
        openQueryForm($(this).attr('href'), $(this).attr('interface'));
        return false;
    });

    $('#submit').bind('click', function(event) {
        $('#adddata').submit();
        return false;
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

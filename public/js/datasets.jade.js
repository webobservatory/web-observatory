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

function requestAcc(oid) {

    $.post('/dataset/access', {
        id: oid
    }, function(msg) {
        alert(msg);
    });

}

$(document).ready(function() {
    $('.tp').tooltip();
    $('#display').dataTable();

    $('.tp').bind('click', function(event) {
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

    $('.req').bind('click', function() {
        var oid = $(this).attr('href');
    });

});

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
});

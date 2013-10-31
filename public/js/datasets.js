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

    $('#read').click(function() {
        var $this = $(this);
        // $this will contain a reference to the checkbox   
        if ($this.is(':checked')) {
            // the checkbox was checked 
            $('#visible').prop('checked', true);
        }
    });

    $('#visible').click(function() {
        var $this = $(this);
        // $this will contain a reference to the checkbox   
        if ($this.not(':checked')) {
            // the checkbox was checked 
            $('#read').prop('checked', false);
        }
    });
});

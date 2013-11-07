function noChecked() {
    return $('#requests form input:checkbox:checked').length === 0;
}

$(document).ready(function() {
    $('#approve').bind('click', function(e) {
        if (noChecked()) {
            alert('No entry selected');
            e.preventDefault();
            return;
        }
        $('#requests form').submit();
    });

    $('#clear').bind('click', function(e) {
        if (noChecked()) {
            alert('No entry selected');
            e.preventDefault();
            return;
        }
        $('#clrflag').val('true');
        $('#requests form').submit();
    });

    $('.disabled').bind('click', function(e) {
        alert('Comming soon');
        e.preventDefault();
    });
});

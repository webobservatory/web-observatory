function noChecked() {
    return $('#msg form input:checkbox:checked').length === 0;
}

$(document).ready(function() {
    $('#approve').bind('click', function() {
        if (noChecked) {
            alert('No entry selected');
            return;
        }
        $('#msg form').submit();
    });

    $('#clear').bind('click', function() {
        if (noChecked) {
            alert('No entry selected');
            return;
        }
        $('#clrflag').val('true');
        $('#msg form').submit();
    });
});

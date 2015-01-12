function noChecked() {
    return 0 === $('#requests form input:checkbox:checked').length;
}

function delEtry(name, url) {
    $('#delModal .modal-body').text('Please confirm to delete ' + name + '?');
    $('#del').attr('href', url);
    $('#delModal').modal('show');
}

$(document).ready(function() {
    $('.tp').tooltip();

    $('.del').bind('click', function(e) {
        e.preventDefault();
        delEtry($(this).attr('name'), $(this).attr('href'));
    });

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
});

function noChecked() {
    return 0 === $('#requests form input:checkbox:checked').length;
}

function newApp(){
  $.get();
};

function delEtry(eid, name) {
    $('#delModal .modal-body').text('Are you sure to delete ' + name + '?');
    $('#del').attr('href', '/remove/' + eid);
    $('#delModal').modal('show');
}

$(document).ready(function() {
    $('.tp').tooltip();

    $('.edit').bind('click', function(e) {
        e.preventDefault();
        editEtry($(this).attr('eid'), $(this).attr('acc'), $(this).attr('vis'));
    });

    $('.del').bind('click', function(e) {
        e.preventDefault();
        delEtry($(this).attr('eid'), $(this).attr('name'));
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

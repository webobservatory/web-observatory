function editEtry(etryId, acc, vis) {
    $('#editForm')[0].reset();
    $('#eid').val(etryId);
    $('#private').prop('checked', acc === 'false');
    $('#visible').prop('checked', vis === 'false');
    $('#editModal').modal('show');
}

function noChecked() {
    return $('#requests form input:checkbox:checked').length === 0;
}

var rc = []; //datasets whose readability have been changed
var vc = []; //datasets whose visibility have been changed

function delEtry(etryId, name) {
    $('#delModal .modal-body').text('Are you sure to delete ' + name + '?');
    $('#del').attr('href', '/remove/' + etryId);
    $('#delModal').modal('show');
}

$(document).ready(function() {
    $('.tp').tooltip();
    $('#display').dataTable({
        "sDom": "<'row'<'span4'l><'span4'f>r>t<'row'<'span4'i><'span4'p>>",
        "sPaginationType": "bootstrap"
    });
    $.extend($.fn.dataTableExt.oStdClasses, {
        "sWrapper": "dataTables_wrapper form-inline"
    });
    $('.prt').bind('click', function(e) {
        var id = $(this).attr('name');
        var i = rc.indexOf("b");
        if (i != -1) {
            rc.splice(i, 1);
        } else {
            rc.push(id);
        }
    });


    $('.edit').bind('click', function(e) {
        editEtry($(this).attr('eid'), $(this).attr('acc'), $(this).attr('vis'));
        e.preventDefault();
    });

    $('.del').bind('click', function(e) {
        delEtry($(this).attr('eid'), $(this).attr('name'));
        e.preventDefault();
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

    $('.disabled').bind('click', function(e) {
        alert('Comming soon');
        e.preventDefault();
    });

    $('#submit').bind('click', function() {
        $('#editForm').submit();
    });
});

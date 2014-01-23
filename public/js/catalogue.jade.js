function editEtry(etryId) {
    $('#eid').val(etryId);
    $('#editModal').modal('show');
}

function delEtry(etryId) {}

$(document).ready(function() {

    $('.tp').tooltip();
    $('#display').dataTable({
        "sDom": "<'row'<'span6'l><'span6'f>r>t<'row'<'span6'i><'span6'p>>",
        "sPaginationType": "bootstrap"
    });
    $.extend($.fn.dataTableExt.oStdClasses, {
        "sWrapper": "dataTables_wrapper form-inline"
    });
    $('.edit:not(.disabled)').bind('click', function() {
        editEtry($(this).attr('eid'));
    });

    $('.del:not(.disabled)').bind('click', function() {
        delEtry($(this).attr('eid'));
    });

    $('#submit').bind('click', function() {
        $('#editForm').submit();
    });

    $('.disabled').bind('click', function(event) {
        $('.alert.alert-info').show();
        $('.alert.alert-info').fadeIn('fast');
        event.preventDefault();
    });
});

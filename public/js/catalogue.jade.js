function editEtry(etryId) {
    $('#eid').val(etryId);
    $('#private').prop('checked', acc==='false');
    $('#visible').prop('checked', vis==='false');
    $('#editModal').modal('show');
}

$(document).ready(function() {

    $('.tp').tooltip();
    $('#display').dataTable({
        "sDom": "<'row'<'span6'l><'span6'f>r>t<'row'<'span6'i><'span6'p>>",
        "sPaginationType": "bootstrap"
    });
    $.extend($.fn.dataTableExt.oStdClasses, {
        "sWrapper": "dataTables_wrapper form-inline"
    });

    $('.edit').bind('click', function(e) {
        editEtry($(this).attr('eid'),$(this).attr('acc'),$(this).attr('vis'));
        e.preventDefault();
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

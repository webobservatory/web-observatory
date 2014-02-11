function editEtry(etryId, acc, vis) {
    $('#eid').val(etryId);
    $('#private').prop('checked', acc === 'false');
    $('#visible').prop('checked', vis === 'false');
    $('#editModal').modal('show');
}

$(document).ready(function() {

    $('.tp').tooltip();
    $('#display').dataTable({
        "sPaginationType": "bs_normal"
    });

    $('.edit').bind('click', function(e) {
        editEtry($(this).attr('eid'), $(this).attr('acc'), $(this).attr('vis'));
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

function editEtry(etryId, acc, vis) {
    $('#eid').val(etryId);
    $('#private').prop('checked', acc === 'false');
    $('#visible').prop('checked', vis === 'false');
    $('#editModal').modal('show');
}

$(document).ready(function() {

    $('.tp').tooltip();
    /*
    $('#display').dataTable({
        "sPaginationType": "bs_normal"
    });
    */

    /*
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
    */

    //datatable bt3
    var search_input = $('.dataTables_filter input[type=text]');
    search_input.attr('placeholder', 'Search').addClass('form-control input-small');
    $('.dataTables_length select').addClass('form-control input-small');
    //$('.dataTables_length label').addClass('control-label');

    //deep linking
    $.address.strict(false);
    $.address.change(function(event) {
        console.log(event);
        var id = event.value;
        if (id) {
            $('#details').load('/wo/' + id);
            $('#display').addClass('col-md-6');
        } else {
            $('#details').html('');
            $('#display').removeClass('col-md-6');
        }
    });
});

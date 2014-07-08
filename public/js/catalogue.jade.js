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
        var id = event.value;
        if (id) {
            $('#details').load('/wo/' + id);
            var isOwner = $('#owner').attr('value'),
                opAcc = $('#acc').attr('value'),
                querytype = $('#querytype') ? $('#querytype').text() : null;

            if (isOwner) {
                $('#edit').removeClass('hidden'); //TODO bind x-editable handler
            }

            if (opAcc) {
                $('#explore').removeClass('hidden');
                if (querytype)
                    $('#explore').attr('href', '/query/' + querytype + '/' + id + '/' + $('#name').text());
                else
                    $('#explore').attr('href', $('#url').text());
            }

            $('#display').addClass('col-md-6');
        } else {
            $('#details').html('');
            $('#display').removeClass('col-md-6');
            $('#edit').addClass('hidden'); //TODO remove x-editable handler
            $('#explore').addClass('hidden').attr('href', '#');
        }
    });
});

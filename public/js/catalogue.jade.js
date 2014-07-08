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

    */

    /*
    //datatable bt3
    var search_input = $('.dataTables_filter input[type=text]');
    search_input.attr('placeholder', 'Search').addClass('form-control input-small');
    $('.dataTables_length select').addClass('form-control input-small');
    //$('.dataTables_length label').addClass('control-label');
*/
    //x editable
    function xeditable() {
        $.fn.editable.defaults.mode = 'inline';
        $('#edit').click(function() {
            $('span.editable').editable('toggleDisabled');
        });
        $('.xedit span').filter('[data-type=textarea], [data-type=text], [data-type=url]').editable({
            disabled: true
        });
        var querytype = $('#querytype');
        if (querytype) {
            querytype.editable({
                disabled: true,
                value: 'SPARQL',
                source: [{
                    value: 'SPARQL',
                    text: 'SPARQL'
                }, {
                    value: 'MySQL',
                    text: 'MySQL'
                }, {
                    value: 'PostgreSQL',
                    text: 'PostgreSQL'
                }, {
                    value: 'Hive',
                    text: 'Hadoop Hive'
                }, {
                    value: 'MongoDB',
                    text: 'MongoDB'
                }]
            });
        }

        var related = $('#related');
        if (related) {
            related.editable({
                disabled: true,
                typeahead: {
                    remote: '/nametags/dataset/?term=%QUERY'
                }
            });
        }

        //$('span.editable').editable('toggleDisabled');

    }

    //deep linking
    $.address.strict(false);
    $.address.change(function(event) {
        var id = event.value;
        if (id) {
            $('#details').load('/wo/' + id, function() {

                var isOwner = $('#owner').attr('value'),
                    opAcc = $('#acc').attr('value'),
                    querytype = $('#querytype') ? $('#querytype').text() : null;
                $('#edit').addClass('hidden').off('click'); //TODO remove x-editable handler
                $('#explore').addClass('hidden').attr('href', '#');

                if (isOwner) {
                    xeditable();
                    $('#edit').removeClass('hidden');
                }

                if (opAcc) {
                    $('#explore').removeClass('hidden');
                    if (querytype)
                        $('#explore').attr('href', '/query/' + querytype + '/' + id + '/' + $('#name').text());
                    else
                        $('#explore').attr('href', $('#url').text());
                }
                $('#display').addClass('col-md-6');
            });

        } else {
            $('#details').html('');
            $('#display').removeClass('col-md-6');
            $('#edit').addClass('hidden');
            $('#explore').addClass('hidden').attr('href', '#');
        }
    });
});

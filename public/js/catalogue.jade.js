$(document).ready(function () {

    $('.tp').tooltip();

    //datatable bt3
    $('#display table').dataTable();

    //x editable
    function xeditable() {

        $.fn.editable.defaults.mode = 'inline';
        
        $('#edit').click(function () {
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
                source: [
                    {
                        value: 'SPARQL',
                        text: 'SPARQL'
                    },
                    {
                        value: 'MySQL',
                        text: 'MySQL'
                    },
                    {
                        value: 'PostgreSQL',
                        text: 'PostgreSQL'
                    },
                    {
                        value: 'Hive',
                        text: 'Hadoop Hive'
                    },
                    {
                        value: 'MongoDB',
                        text: 'MongoDB'
                    }
                ]
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
    }

    //reset helper functions
    function resetToolBar() {
        $('#edit').addClass('hidden').off('click');
        $('#explore').addClass('hidden').attr('href', '#').off('click');
        $('#request').addClass('hidden').attr('href', '#').off('click');
    }

    function resetView() {
        $('#details').html('');
        $('#querypan').html('');
        $('#display').removeClass('col-sm-6');
    }

    //deep linking
    function rightPan(id) {
        if (id) {
            resetToolBar();
            $('#querypan').html('');
            $('#details').load('/wo/' + id, function () {
                var isOwner = $('#owner').attr('value') === 'true',
                    opAcc = $('#acc').attr('value') === 'true',
                    querytype = $('#querytype') ? $('#querytype').text().toLowerCase() : null;

                if (isOwner) {
                    xeditable();
                    $('#edit').removeClass('hidden');
                }

                if (opAcc) {
                    $('#explore').removeClass('hidden');
                    if (querytype) {
                        $('#explore').attr('href', '/query/' + querytype + '/' + id).click(function (event) {
                            event.preventDefault();
                            $('#querypan').load('/query/' + querytype + '/' + id);
                        });
                    } else
                        $('#explore').attr('href', '/wo/show/' + id);
                } else {
                    $('#request').removeClass('hidden').attr('href', '/reqacc/' + id).click(function (event) {
                        event.preventDefault();
                        $.get($(this).attr('href'), function (data) {
                            $('#flash-banner').html(data);
                        });
                    });
                }
                $('#display').addClass('col-sm-6');
            });
        } else {
            resetToolBar();
            resetView();
        }
    }

    $.address.strict(false);
    $.address.change(function (event) {
        var id = event.value;
        rightPan(id);
    });
});

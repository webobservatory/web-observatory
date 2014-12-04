$(document).ready(function () {

    $('.tp').tooltip();

    //datatable bt3
    $('#display table').dataTable({order: []});

    //x editable
    function xeditable() {

        $.fn.editable.defaults.mode = 'inline';

        $('#edit').click(function () {
            $('span.editable').editable('toggleDisabled');
        });

        $('.xedit span').filter('[data-type=textarea], [data-type=text], [data-type=url]').editable({
            disabled: true
        });

        $('#opAcc').editable({
            disabled: true,
            source: [
                {
                    value: 1,
                    text: 'Everyone'
                },
                {
                    value: 0,
                    text: 'Authorised only'
                }
            ]
        });

        $('#opVis').editable({
            disabled: true,
            source: [
                {
                    value: 1,
                    text: 'Everyone'
                },
                {
                    value: 0,
                    text: 'Authorised only'
                }
            ]
        });
        
        var querytype = $('#querytype');
        if (querytype) {
            querytype.editable({
                disabled: true,
                value: querytype.text(),
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
        $('#display').removeClass('col-md-6');
    }

    //deep linking
    function rightPan(id) {
        if (id) {
            resetToolBar();
            $('#querypan').html('');
            $('#details').load('/wo/' + id, function () {
                xeditable();
                var isOwner = $('#owner').attr('value') === 'true',
                    opAcc = $('#acc').attr('value') === 'true',
                    querytype = $('#querytype') ? $('#querytype').text().toLowerCase() : null;

                if (isOwner) {
                    $('#edit').removeClass('hidden');
                }

                if (opAcc) {
                    if (querytype) {//display query panel for datasets
                        $('#querypan').load('/query/' + querytype + '/' + id);
                    } else {
                        $('#explore').removeClass('hidden');
                        $('#explore').attr('href', $('#url').attr('value'));
                    }
                } else {
                    $('#request').removeClass('hidden').attr('href', '/reqacc/' + id).click(function (event) {
                        event.preventDefault();
                        $.get($(this).attr('href'), function (data) {
                            $('#flash-banner').html(data);
                        });
                    });
                }
                $('#display').addClass('col-md-6');
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

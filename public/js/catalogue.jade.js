$(document).ready(function () {

    'use strict';
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

        var querytype = $('#querytype'),
            related = $('#related'),
            kw = $('#kw');

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
                        value: 'MongoDB',
                        text: 'MongoDB'
                    }
                ]
            });
        }

        if (related) {
            related.editable({
                    disabled: true,
                    inputclass: 'input-large',
                    select2: {
                        tokenSeparators: [",", " "],
                        minimumInputLength: 2,
                        tags: [],
                        initSelection: function (element, callback) {//required to displaying existing tags
                            var data = [];
                            $('#related').text().split(',').forEach(function (text) {
                                data.push({id: text, text: text});
                            });
                            callback(data);
                        },
                        ajax: {
                            url: '/nametags/dataset',
                            dataType: 'json',
                            data: function (term, page) {
                                return {term: term, page: page};
                            },
                            results: function (data, page) {
                                data = data.map(function (ds) {
                                    return {id: ds, text: ds};
                                });
                                return {results: data};
                            }
                        }
                    }
                }
            );

            kw.editable({
                disabled: true,
                source: {},
                inputclass: 'input-large',
                select2: {tokenSeparators: [",", " "], tags: []}
            });
            //related.editable({
            //    disabled: true,
            //    typeahead: {
            //        remote: '/nametags/dataset/?term=%QUERY'
            //    }
            //});

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
                        $('#explore').removeClass('hidden').attr('href', $('#url').attr('value'));
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

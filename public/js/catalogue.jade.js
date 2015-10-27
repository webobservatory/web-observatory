$(document).ready(function() {

    'use strict';
    $('[data-toggle="tooltip"]').tooltip();

    //datatable bt3
    var table = $('#display table').DataTable({
        order: []
    });


    //detail & query panels
    var lastAccordion = null;

    //deep linking
    $.address.strict(false);
    $.address.change(function(event) {
        var id = event.value;

        if (lastAccordion) {
            lastAccordion.child.hide();
        }

        appendAccordion(id);
        display(id);
    });

    function appendAccordion(id) {
        var tr = $('#' + id);
        var row = lastAccordion = table.row(tr);
        if (!row.child.isShown()) {
            // Open this row
            row.child(panel(id), id).show();
        }
    }

    function panel(id) {
        return '<div class="details col-sm-6"></div>' +
            '<div class="querypan col-sm-6"></div>';
    }

    function display(id) {
        if (id) {
            resetToolBar();
            var target = $('tr.' + id),
                detail_elt = target.find('.details'),
                query_elt = target.find('.querypan');

            //if (detail_elt.html() === '') {

            detail_elt.load('/wo/' + id, function() {
                xeditable();
                var isOwner = detail_elt.children('span[name="owner"]').attr('value') === 'true',
                    opAcc = detail_elt.children('span[name="acc"]').attr('value') === 'true';
                var qtypelt = detail_elt.find('#mediatype');
                var querytype = qtypelt ? qtypelt.text().toLowerCase() : null;

                if (isOwner) {
                    $('#edit').removeClass('hidden');
                }

                if (opAcc) {
                    if (querytype && querytype !== 'imported') { //display query panel for datasets
                        query_elt.load('/query/' + querytype + '/' + id);
                    } else {
                        $('#explore').removeClass('hidden').attr('href', $('#url').attr('value'));
                    }
                } else {
                    $('#request').removeClass('hidden').attr('href', '/reqacc/' + id).click(function(event) {
                        event.preventDefault();
                        $.get($(this).attr('href'), function(data) {
                            $('#flash-banner').html(data);
                        });
                    });
                }
            });
            //target.collapse('show');
        } else {
            resetToolBar();
        }
    }

    //x editable
    function xeditable() {

        $.fn.editable.defaults.mode = 'inline';

        $('#edit').click(function() {
            $('span.editable').editable('toggleDisabled');
        });

        $('.xedit span').filter('[data-type=textarea], [data-type=text], [data-type=url]').editable({
            disabled: true
        });

        $('#opAcc').editable({
            disabled: true,
            source: [{
                value: 1,
                text: 'Everyone'
            }, {
                value: 0,
                text: 'Authorised only'
            }]
        });

        $('#opVis').editable({
            disabled: true,
            source: [{
                value: 1,
                text: 'Everyone'
            }, {
                value: 0,
                text: 'Authorised only'
            }]
        });

        var querytype = $('#querytype'),
            related = $('#related'),
            kw = $('#kw');

        if (querytype) {
            querytype.editable({
                disabled: true,
                value: querytype.text(),
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
                    value: 'MongoDB',
                    text: 'MongoDB'
                }]
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
                    initSelection: function(element, callback) { //required to displaying existing tags
                        var data = [];
                        $('#related').text().split(',').forEach(function(text) {
                            data.push({
                                id: text,
                                text: text
                            });
                        });
                        callback(data);
                    },
                    ajax: {
                        url: '/nametags/dataset',
                        dataType: 'json',
                        data: function(term, page) {
                            return {
                                term: term,
                                page: page
                            };
                        },
                        results: function(data, page) {
                            data = data.map(function(ds) {
                                return {
                                    id: ds,
                                    text: ds
                                };
                            });
                            return {
                                results: data
                            };
                        }
                    }
                }
            });

            kw.editable({
                disabled: true,
                source: {},
                inputclass: 'input-large',
                select2: {
                    tokenSeparators: [",", " "],
                    tags: []
                }
            });
            //related.editable({
            //    disabled: true,
            //    typeahead: {
            //        remote: '/nametags/dataset/?term=%QUERY'
            //    }
            //});

        }
    }

    //toggle detail panles
    $('a[data-toggle="tooltip"]').click(function() {
        var tr = $(this).closest('tr');
        var row = table.row(tr);

        if (row.child.isShown()) {
            // This row is already open - close it
            row.child.hide();
            lastAccordion = null;
        } else {
            // Open this row
            if (lastAccordion && lastAccordion !== row) {
                lastAccordion.child.hide();
            }
            lastAccordion = row;
            row.child.show();
        }
    });


    //reset helper functions
    function resetToolBar() {
        $('#edit').addClass('hidden').off('click');
        $('#explore').addClass('hidden').attr('href', '#').off('click');
        $('#request').addClass('hidden').attr('href', '#').off('click');
    }

    //to gain a smooth animation when clicking the link
    $('.entry a').click(function(event) {
        event.preventDefault();
        $.address.value($(this).attr('href').slice(1));
    })
});

$(document).ready(function() {
    //x editable

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
                }, {
                    value: 'HTML',
                    text: 'HTML'
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
});

$(document).ready(function() {
    $('#edittog').bind('click', function() {
        $('a.editable').editable('toggleDisabled');
    });
    //$.fn.editable.defaults.mode = 'inline';
    $('a.editable').filter('[data-type=textarea], [data-type=text], [data-type=url]').editable();
    var querytype = $('#querytype');
    if (querytype) {
        querytype.editable({
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
                }
            ]
        });
    }

    var related = $('#related');
    if (related) {
        related.editable({
            typeahead: {
                remote: '/nametags/dataset/?term=%QUERY'
            }
        });
    }

    var acc_ctrl = $('#acc');
    if (acc_ctrl) {
        acc_ctrl.editable({
            value: [],
            source: [{
                    value: 'private',
                    text: 'Private entry. I wish to authorise indivadual users to access this entry'
                }, {
                    value: 'novis',
                    text: 'Do not list this entry in the public catalogue'
                }
            ]
        });
    }
    $('a.editable').editable('toggleDisabled');

    $('#optogl').bind('click', function() {
        $('#optogl span').toggleClass('glyphicon-chevron-down glyphicon-chevron-up');
    });
    //$("input,select,textarea").not("[type=submit]").jqBootstrapValidation();
});

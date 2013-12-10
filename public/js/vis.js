var getDsNames = function() {
    $.get("/wo/dataset/names", function(data) {
        availableTags = data.tags;
        $("#tags").autocomplete({
            source: availableTags
        });
    });
};

var availableTags = [
        "DBpedia",
        "Twitter Dataset - Septermber 2013",
        "Weibo Dataset",
        "Wikipedia Dataset"
];

$(document).ready(function() {
    $('.tp').tooltip();
    $('#display').dataTable();
    $('#submit').bind('click', function(event) {
        $('#adddata').submit();
        event.preventDefault();
    });
    getDsNames();
});

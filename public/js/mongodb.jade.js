$(document).ready(function() {
    tags = JSON.parse(tags);
    $('#modname').autocomplete({
        source: tags
    });
});

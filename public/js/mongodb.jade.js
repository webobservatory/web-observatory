var tags = !{JSON.stringify(tags)};
$(document).ready(function() {
    tags = JSON.parse(tags);
    $('#modname').autocomplete({
        source: tags
    });
})
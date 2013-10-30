$(document).ready(function() {
    $(".tp").tooltip();
    $("#endpoint-frame").load("/queries/sparql.html", function() {
        start();
    });
    $("a").bind("click", function(event) {
        var href = $(this).attr("href");
        if (href.indexOf("Mongo") != -1)
            $("#endpoint-frame").load("/queries/mongo.html");
        if (href.indexOf("SPARQL") != -1)
            $("#endpoint-frame").load("/queries/sparql.html", function() {
                start();
            });
        if (href.indexOf("RAGLD") != -1)
            $("#endpoint-frame").load("/queries/ragld.html");
    });
});

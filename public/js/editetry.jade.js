$(document).ready(function() {
    $('#optogl').bind('click', function() {
        $('#optogl span').toggleClass('glyphicon-chevron-down glyphicon-chevron-up');
    });
    $("input,select,textarea").not("[type=submit]").jqBootstrapValidation();
    $('#dsTils').autocomplete({
        source: '/autocomplete'
    });
});

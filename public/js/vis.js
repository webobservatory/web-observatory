$(document).ready(function() {
    $('.tp').tooltip();
    $('#display').dataTable();
    $('#submit').bind('click', function(event) {
        $('#adddata').submit();
        event.preventDefault();
    });
});

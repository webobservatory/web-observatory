function noChecked() {
    return $('#requests form input:checkbox:checked').length === 0;
}

var rc = []; //datasets whose readability have been changed
var vc = []; //datasets whose visibility have been changed

$(document).ready(function() {
    $('.prt').bind('click', function(e) {
        var id = $(this).attr('name');
        var i = rc.indexOf("b");
        if (i != -1) {
            rc.splice(i, 1);
        } else {
            rc.push(id);
        }
    });


    $('#status').bind('click', function(e) {
        e.preventDefault();
        if (rc.length === 0)
            return;
        var staform = $('#staform');

        for (i = 0; i < rc.length; i++) {
            var input = $('input[name="' + rc[i] + '"]');
            if (input.is(':checked'))
                staform.append('<input name="' + rc[i] + '" value="private"></input>');
            else
                staform.append('<input name="' + rc[i] + '" value="public"></input>');
        }
        staform.attr('action', '/dataset/access');
        staform.submit();
    });

    $('#approve').bind('click', function(e) {
        if (noChecked()) {
            alert('No entry selected');
            e.preventDefault();
            return;
        }
        $('#requests form').submit();
    });

    $('#rmdt').bind('click', function(e) {
        e.preventDefault();
        var staform = $('#staform');

        var inputs = $('input[name=remove]:checked');
        if (inputs.length === 0)
            return alert('No entry selected');
        staform.append(inputs);
        staform.attr('action', '/dataset/remove');
        staform.submit();
    });

    $('#clear').bind('click', function(e) {
        if (noChecked()) {
            alert('No entry selected');
            e.preventDefault();
            return;
        }
        $('#clrflag').val('true');
        $('#requests form').submit();
    });

    $('.disabled').bind('click', function(e) {
        alert('Comming soon');
        e.preventDefault();
    });
});

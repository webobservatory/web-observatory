$(document).ready(function() {
    $('#private').bind('click', function() {
        var $this = $(this);
        // $this will contain a reference to the checkbox   
        if ($this.prop('checked')) {
            // the checkbox was checked 
            $('#visible').fadeIn();
        }

        if (!$this.prop('checked')) {
            $('#visible').fadeOut();
            $('#visible input').prop('checked', false);
        }
    });
    var availableTags = ['aaaa', 'aaaB','baaB'];

    $('#dsTils').autocomplete({
        source: '/autocomplete'
    });
});

function passMatch() {
    var pass = $('input:password[name=pass]').val(),
        cnfirm = $('input:password[name=confirm]').val();

    if (pass !== cnfirm)
        $('.alert-warning').show();
    else
        $('.alert-warning').hide();


}
$(document).ready(function() {
    $('input:password[name=confirm]').keyup(passMatch);
});

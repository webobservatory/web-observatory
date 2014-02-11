function passMatch() {
    var pass = $('input:password[name=password]').val(),
        cnfirm = $('input:password[name=confirm]').val();

    if (pass !== cnfirm)
        $('.alert-warning').addClass('in').show();
    else
        $('.alert-warning').removeClass('in').hide();
}
$(document).ready(function() {

    $('input:password[name=confirm]').keyup(passMatch);
    $('input,select,textarea').not("[type=submit]").jqBootstrapValidation();
});

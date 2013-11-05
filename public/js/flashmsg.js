function hideFlashMessages() {
    $(this).fadeOut();
}

setTimeout(function() {
    $('.alert').each(hideFlashMessages);
}, 10000);

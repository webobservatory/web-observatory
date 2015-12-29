Template.entryPage.helpers({
    appendHash(str) {
        return '#' + str;
    }
});
Template.entryPage.rendered = function () {
    $('ul.tabs').tabs();
    //window.location.href = window.location.hash;
};

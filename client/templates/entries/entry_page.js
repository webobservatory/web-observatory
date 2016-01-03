Template.entryPage.helpers({
    appendHash(str) {
        return '#' + str;
    },
    distData() {
        this.dsId = Template.parentData().entry._id;
        return this;
    }
});

Template.entryPage.rendered = function () {
    $('ul.tabs').tabs();
};


Template.entryPage.helpers({
    appendHash(str) {
        return '#' + str;
    },
    distData() {
        this.dsId = Template.parentData().entry._id;
        return this;
    },
    queryResult() {
        return Session.get('queryResult');
    }
});

Template.entryPage.rendered = function () {
    $('ul.tabs').tabs();
    // the "href" attribute of .modal-trigger must specify the modal ID that wants to be triggered
    $('.modal-trigger').leanModal({dismissible: true});
};


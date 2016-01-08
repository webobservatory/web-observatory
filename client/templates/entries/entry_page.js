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
    $('.modal-trigger').leanModal({
        complete: function () {
            Session.set('queryResult', null);
        }
    });

    //transform type=url to link
    $('[type=url]').after(function () {
        let url = this.value;
        if (url) {
            $(this).hide();
            return "<a href='" + url + "'>" + url + "</a>";
        }
    });
};

Template.entryPage.events({
    'click a.modal-action.modal-close': function (e) {
        console.log(e);
        Streamy.emit('amqp_end');
    }
});

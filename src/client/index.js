Template.home.onRendered(function () {
    $('a.page-scroll').bind('click', function (event) {
        var $anchor = $(this);
        $('html, body').stop().animate({
            scrollTop: $($anchor.attr('href')).offset().top
        }, 1500, 'easeInOutExpo');
        event.preventDefault();
    });
});

Template.home.helpers({
    editorChoice(tmpData) {
        let coll = tmpData.category;
        let adminIds = Meteor.users.find({username: 'admin'}).map(admin=>admin._id);
        tmpData.entries = coll.find({upvoters: {$in: adminIds}});
        return tmpData;
    }
});


function isEditorChoice(entry) {
    let adminIds = Meteor.users.find({roles: 'admin'}).map(admin=>admin._id);
    let upvoters = entry.upvoters;

    let inter = _.intersection(adminIds, upvoters);

    let editorChoice = inter.length !== 0;

    return editorChoice;
}

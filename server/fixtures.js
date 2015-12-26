/* testing cases
 *               ds1 (all)     ds2 (none)     ds3 (group)
 * admin           y               y            y
 * individual      y               n            n
 * member          y               n            y
 * group           y               n            y
 * */

function addAdmin(name) {

    var xgfdId = Accounts.createUser({
        profile: {
            name: name
        },
        username: name,
        email: name + "@example.com",
        password: "123456",
    });

    Roles.removeUserFromRoles(xgfdId, ["individual"]);
    Roles.addUserToRoles(xgfdId, ["admin"]);

    return xgfdId;
}

function addIndividual(name) {
    return Accounts.createUser({
        profile: {
            name: name
        },
        username: name,
        email: name + "@example.com",
        password: "123456",
    });
}

function addGroup(name) {
    var xgfdId = Accounts.createUser({
        profile: {
            name: name,
            isgroup: true
        },
        username: name,
        email: name + "@example.com",
        password: "123456",
    });

    Roles.removeUserFromRoles(xgfdId, ["individual"]);
    Roles.addUserToRoles(xgfdId, ["group"]);

    return xgfdId;
}

if (Meteor.users.find().count() === 0) {
    var xgfdId = addAdmin('xgfd');
    var individualId = addIndividual('individual');
    var groupId = addGroup('group');
    var memberId = addIndividual('member');
    Meteor.call('addToGroup', memberId, groupId);
}

// Fixture data
if (Datasets.find().count() === 0) {
    var now = new Date().getTime();

    var telescopeId = Datasets.insert({
        name: 'Introducing Telescope',
        publisher: sacha._id,
        distribution: [{
            url: 'http://sachagreif.com/introducing-telescope/',
            fileFormat: "MongoDB"
        }],
        license: "MIT",
        description: "test 1",
        commentsCount: 2,
        aclContent: false,
        online: false,
        upvoters: [], votes: 0
    });

    Comments.insert({
        entryId: telescopeId,
        publisher: tom._id,
        author: tom.profile.name,
        submitted: new Date(now - 5 * 3600 * 1000),
        body: 'Interesting project Sacha, can I get involved?'
    });

    Comments.insert({
        entryId: telescopeId,
        publisher: sacha._id,
        author: sacha.profile.name,
        submitted: new Date(now - 3 * 3600 * 1000),
        body: "<p><span style=\"font-family: 'Comic Sans MS';\"><span style=\"font-size: 18px; background-color: rgb(255, 0, 0);\">You</span><span style=\"font-size: 18px;\"> </span><span style=\"font-size: 18px; background-color: rgb(255, 156, 0);\">sure</span><span style=\"font-size: 18px;\"> </span><span style=\"font-size: 18px; background-color: rgb(255, 255, 0);\">can</span><span style=\"font-size: 18px;\"> </span><span style=\"font-size: 18px; background-color: rgb(0, 255, 0);\">Tom</span><span style=\"font-size: 18px; background-color: rgb(0, 0, 255);\">!!!</span></span></p>"

    });

    Datasets.insert({
        name: 'The Meteor Book',
        publisher: tom._id,
        distribution: [{
            url: 'http://themeteorbook.com',
            fileFormat: "MySQL"

        }],
        license: "MIT",
        description: "test 2",
        commentsCount: 0,
        online: false,
        upvoters: [], votes: 0
    });

    for (var i = 0; i < 10; i++) {
        Datasets.insert({
            name: 'Test post #' + i,
            publisher: tom._id,
            distribution: [{
                url: 'http://themeteorbook.com',
                fileFormat: "MySQL",
                online: false
            }, {url: 'http://themeteorbook.com', fileFormat: "SPARQL"}],
            license: "MIT",
            description: "test test test test test test 2",
            commentsCount: 0,
            upvoters: [], votes: 0
        });
    }
}
;


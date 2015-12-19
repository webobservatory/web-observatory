var sacha = {};
var tom = {};

if (Meteor.users.find().count() === 0) {
    // create two users

    var sachaId = Accounts.createUser({
        profile: {
            name: 'Sacha Greif'
        },
        username: "sacha",
        email: "sacha@example.com",
        password: "123456",
    });

    var tomId = Accounts.createUser({
        profile: {
            name: 'Tom Coleman'
        },
        username: "tom",
        email: "tom@example.com",
        password: "123456",
    });

    sacha = Meteor.users.findOne(sachaId);
    tom = Meteor.users.findOne(tomId);

}
;

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
        upvoters: [], votes: 0
    });

    Comments.insert({
        datasetId: telescopeId,
        userId: tom._id,
        author: tom.profile.name,
        submitted: new Date(now - 5 * 3600 * 1000),
        body: 'Interesting project Sacha, can I get involved?'
    });

    Comments.insert({
        datasetId: telescopeId,
        userId: sacha._id,
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
        upvoters: [], votes: 0
    });

    // for (var i = 0; i < 10; i++) {
    //   Datasets.insert({
    //     title: 'Test post #' + i,
    //     userId: sacha._id,
    //     url: 'http://google.com/?q=test-' + i,
    //     commentsCount: 0,
    //     upvoters: [], votes: 0
    //   });
    // }
}
;


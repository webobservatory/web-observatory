/**
 * Created by xgfd on 21/10/2016.
 */

checkCon = function () {
    let apps = Apps.find().fetch(),
        datasets = Datasets.find().fetch();

    let dists = datasets.map(ds=>ds.distribution);
    dists = _.flatten(dists);

    apps.forEach(app=>appConnTest(app._id));
    dists.forEach(dist=>dbConnTest(dist._id, dist.fileFormat));
}

function dbConnTest(id, format) {
    let supported = ['MongoDB', 'MySQL', 'AMQP', 'SPARQL', 'HTML'];
    if (_.includes(supported, format)) {
        let method = format.toLowerCase() + 'Connect';
        Meteor.call(method, id);
    }
}

function appConnTest(id) {
    Meteor.call('appConnect', id);
}

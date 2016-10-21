/**
 * Created by xgfd on 21/10/2016.
 */

checkCon = function () {
    let apps = App.find().fetch(),
        datasets = Datasets.find().fetch();

    let dists = datasets.map(ds=>ds.distribution);
    dists = _.flatten(dists);

    apps.forEach(app=>appConnTest(app._id));
    dists.forEach(dist=>dbConnTest(dist._id, dist.fileFormat));
}

function dbConnTest(id, format) {
    let method = format.toLowerCase() + 'Connect';
    Meteor.call(method, id, (err)=> {
        if (err) {
            Datasets.update({"distribution._id": id}, {$set: {'distribution.$.online': false}});
        } else {
            Datasets.update({"distribution._id": id}, {$set: {'distribution.$.online': true}});
        }
    });
}

function appConnTest(id, format = 'html') {
    let method = format.toLowerCase() + 'Connect';
    Meteor.call(method, id, (err)=> {
        if (err) {
            Apps.update({_id: id}, {$set: {'online': false}});
        } else {
            Apps.update({_id: id}, {$set: {'online': true}});
        }
    });
}

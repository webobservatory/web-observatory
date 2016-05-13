/**
 * Created by xgfd on 25/12/2015.
 */

/**
 *
 * @param coll A collection
 * @param pubCBFactry A factory function that returns the publish callback
 * @param pubAs Maps a collection to publishing name
 */
publish = function (coll, pubCBFactry, pubAs = (coll)=>coll._name) {
    let name = pubAs(coll);
    Meteor.publish(name, pubCBFactry(coll, name));
};

JSONStream = Meteor.npmRequire('JSONStream');

/**
 * Created by xgfd on 25/12/2015.
 */

/*
 * For each @name:@collection pair in @sources, publish @collection under @name using @publisher
 * The callback of @publisher is constricted by @cbGen(@name, @collection)->function
 */
publish = function (sources, publisher, cbGen) {
    for (let name in sources) {
        if (sources.hasOwnProperty(name)) {
            publisher(name, cbGen(sources[name], name));
        }
    }
};

/*
 * Extends @query with @or clause
 * If @query.$or exists, replace it with $and:[{$or:query.$or}, or]
 */
extendOr = function (query, or) {
    check(query, Object);
    check(or, {$or: Array});

    if (query.$or) {
        query.$and = [{$or: query.$or}, or];
        delete  query.$or;
    } else {
        _.extend(query, or);
    }
};
JSONStream = Meteor.npmRequire('JSONStream');

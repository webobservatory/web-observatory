/**
 * Created by xgfd on 08/06/2016.
 */

export default function accessData(req, res) {
    let id = req.params.id,
        {query, collection, options}=req.query;

    if (query === undefined) {
        res.json(new Meteor.Error(400, 'Require a valid query.'));
    }

    let dist = Datasets.findOne({'distribution._id': id}, {fields: {distribution: {$elemMatch: {_id: id}}}}).distribution[0];

    if (dist) {
        let type = dist.fileFormat;
        if (['MongoDB', 'MySQL', 'SPARQL'].indexOf(type) !== -1) {
            type = type.toLowerCase();
            query = parseQuery(query, type);
            let args = [id];

            if (collection) {
                args.push(collection);
            }

            args.push(query);

            if (options) {
                args.push(options);
            }

            Meteor.apply(`${type}Query`, args, (err, result) => {
                res.json(err || result);
            });
        } else {
            res.json(new Meteor.Error(500, 'Distribution type not supported'));
        }

    } else {
        res.json(new Meteor.Error(404, 'Invalid distribution id. Record not found.'));
    }
}

function parseQuery(q, type) {
    if (type === 'mongodb') {
        return JSON.parse(q);
    } else {
        return q;
    }
}

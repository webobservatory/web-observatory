/**
 *
 * Created by xgfd on 08/06/2016.
 */

function relSelf(req) {
    let href = absPath(req);
    let method = req.method;

    return {
        href,
        rel: 'self',
        method
    }
}

export function RESTCompose(headers, links) {
    return function (req, res) {
        try {
            let apiRes = headers instanceof Function ? headers(req) : headers || {};
            let linksArr = links instanceof Function ? links(req) : links || [];
            linksArr.unshift(relSelf(req));
            apiRes.links = linksArr;
            res.json(apiRes);
        } catch (err) {
            res.json(err);
        }
    };
}

export function absPath(req) {
    let path = req.baseUrl + req.path;
    if (path[0] === '/') {
        path = path.substring(1);
    }
    return Meteor.absoluteUrl(path);
}
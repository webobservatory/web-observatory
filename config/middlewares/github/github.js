/**
 *
 * Created by Xin on 10/12/2014.
 */
var clone = require('git-clone'),
    fs = require('fs'),
    fse = require('fs-extra'),
    path = require('path'),
    filebase = 'git';


module.exports = function (req, res, next) {
    "use strict";
    var uid, reponame, gitrepo, wo, giturl = req.body.git;

    if (!giturl) {
        return next();
    }

    wo = (req.secure ? 'https://' : 'http://') + req.get('host');
    uid = req.user._id.toString();
    reponame = giturl.slice(giturl.lastIndexOf('/') + 1, giturl.lastIndexOf('.'));
    try {
        gitrepo = path.join(__dirname, '../../../' + filebase, uid, reponame);

        fs.exists(gitrepo, function (existing) {
            if (!existing) {
                fse.mkdirs(gitrepo, function (err) {
                    if (err) {
                        return next(err);
                    }
                    clone(giturl, gitrepo, function (err) {
                        if (err) {
                            return next(err);
                        }
                        if (!req.body.url) {
                            req.body.url = wo + '/git/' + uid + '/' + reponame;
                        }
                        next();
                    });
                });
            } else {
                fse.remove(gitrepo, function (err) {
                    if (err) {
                        return next(err);
                    }
                    clone(giturl, gitrepo, function (err) {
                        if (err) {
                            return next(err);
                        }
                        if (!req.body.url) {
                            req.body.url = wo + '/git/' + uid + '/' + reponame;
                        }
                        next();
                    });
                });
            }
        });
    } catch (e) {
        next(e);
    }
};

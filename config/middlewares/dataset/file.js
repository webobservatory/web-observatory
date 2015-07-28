'use strict';
var formidable = require('formidable'),
    path = require('path'),
    fs = require('fs'),
    Entry = require('mongoose').model('Entry'),
    fileRoot = path.join(__dirname, '../../../files/');

exports.fileExist = function (fileRelative, cb) {
    var filePath = path.join(fileRoot, fileRelative);
    fs.exists(filePath, cb);
};

exports.fileDownload = function (req, res, next) {
    var eid = req.params.eid || req.query.eid;

    Entry.findById(eid, function (err, entry) {
        if (err) {
            return next(err);
        }

        if (!entry) {
            return next({message: 'No entry found'});
        }

        if ('file' !== entry.querytype.toLowerCase()) {
            return next({message: 'Entry doesn\'t contain a file'});
        }

        var filePath = entry.url,
            file = path.join(fileRoot, filePath);
        if (0 === filePath.indexOf('http') || 0 === filePath.indexOf('ftp')) {
            res.redirect(filePath);
        } else {
            console.log(file);
            res.download(file);
        }
    });
};

function ranFN() {
    return (Math.random() + 1).toString(36).slice(2, 7);
}

var form = new formidable.IncomingForm();
form.keepExtensions = true;

exports.fileUpload = function (req, res) {

    var usrFileFolder;

    usrFileFolder = path.join(fileRoot, req.user.email);

    if (!fs.existsSync(usrFileFolder)) {
        fs.mkdir(usrFileFolder);
    }

    form.uploadDir = usrFileFolder;
    form.parse(req, function (err, fields, files) {
        if (err) {
            res.status(500);
            return res.json({'success': false, error: err});
        }
        var old_path, orgn_fn, file_size, new_fn, new_path, ext;
        old_path = files.file.path;

        //get extension
        orgn_fn = files.file.name;
        var extIndex = orgn_fn.lastIndexOf('.');
        if (extIndex === -1) {
            extIndex = orgn_fn.length;
        }
        ext = orgn_fn.substring(extIndex);

        file_size = files.file.size;
        new_fn = ranFN() + ext;
        new_path = path.join(usrFileFolder, new_fn);

        while (fs.existsSync(new_path)) {
            new_fn = ranFN() + ext;
            new_path = path.join(usrFileFolder, new_fn);
        }

        fs.rename(old_path, new_path, function (err) {
            if (err) {
                res.status(500);
                res.json({'success': false, error: err});
            } else {
                var filePath = path.join(req.user.email, new_fn);
                res.status(200);
                res.json({'success': true, path: filePath, size: file_size});
            }
        });
    });
};

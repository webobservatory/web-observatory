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
            res.download(file);
        }
    });
};

exports.fileUpload = function (req, res) {

    var usrFileFolder, form;

    usrFileFolder = path.join(fileRoot, req.user.email);

    fs.exists(usrFileFolder, function (existing) {
        if (!existing) {
            fs.mkdir(usrFileFolder);
        }
    });

    form = new formidable.IncomingForm();
    form.parse(req, function (err, fields, files) {
        if (err) {
            res.status(500);
            return res.json({'success': false, error: err});
        }
        var old_path, file_size, file_name, new_path, exist, extIndex, renameIndex;

        old_path = files.file.path;
        file_size = files.file.size;//TODO limit file size
        file_name = files.file.name;
        new_path = path.join(usrFileFolder, file_name);


        exist = true;
        extIndex = file_name.lastIndexOf('.');
        renameIndex = 0;

        while (exist) {
            if (fs.existsSync(new_path)) {
                renameIndex += 1;
                file_name = file_name.substring(0, extIndex) + '_' + renameIndex + file_name.substring(extIndex);
                new_path = path.join(usrFileFolder, file_name);
            }
            else {
                exist = false;
            }
        }

        fs.readFile(old_path, function (err, data) {
            if (err) {
                res.status(500);
                return res.json({'success': false, error: err});
            }
            fs.writeFile(new_path, data, function (err) {
                if (err) {
                    res.status(500);
                    return res.json({'success': false, error: err});
                }
                var filePath = path.join(req.user.email, file_name);
                fs.unlink(old_path, function (err) {
                    if (err) {
                        res.status(500);
                        res.json({'success': false, error: err});
                    } else {
                        res.status(200);
                        res.json({'success': true, path: filePath, size: file_size});
                    }
                });
            });
        });
    });
};
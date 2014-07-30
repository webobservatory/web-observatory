'use strict';
var formidable = require('formidable'),
    path = require('path'),
    fs = require('fs'),
    Entry = require('mongoose').model('Entry');

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
            file = path.join(__dirname, '../../files/', filePath);
        res.download(file);
    });
};

exports.fileUpload = function (req, res) {

    var fileFolder = path.join(__dirname, '../../files/', req.user.email);

    fs.exists(fileFolder, function (existing) {
        if (!existing) {
            fs.mkdir(fileFolder);
        }
    });

    var form = new formidable.IncomingForm();
    form.parse(req, function (err, fields, files) {
        var old_path = files.file.path,
            file_size = files.file.size,
            file_name = files.file.name,
            new_path = path.join(fileFolder, file_name);


        var exist = true,
            extIndex = file_name.lastIndexOf('.'),
            renameIndex = 0;

        while (exist) {
            if (fs.existsSync(new_path)) {
                renameIndex += 1;
                file_name = file_name.substring(0, extIndex) + '_' + renameIndex + file_name.substring(extIndex);
                new_path = path.join(fileFolder, file_name);
            }
            else {
                exist = false;
            }
        }

        console.log(new_path);

        fs.readFile(old_path, function (err, data) {
            fs.writeFile(new_path, data, function (err) {
                var filePath = path.join(req.user.email, file_name);
                fs.unlink(old_path, function (err) {
                    if (err) {
                        res.status(500);
                        res.json({'success': false});
                    } else {
                        res.status(200);
                        res.json({'success': true, path: filePath, size: file_size});
                    }
                });
            });
        });
    });
};
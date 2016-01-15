/**
 * Created by xgfd on 14/01/2016.
 */

if (Meteor.settings.public.migrate) {

    function importData(path) {
        console.log('reading from ' + path);
        let data = JSON.parse(Assets.getText(path));
        console.log('importing ' + path);
        data.forEach(_import[path]);
    }

    let _import = {apps: importApp, users: importUser, datasets: importDataset};

    function importUser(user) {
        try {
            Accounts.createUser(user);
        }
        catch (e) {
            if (e.error === 403) {//username already exists
                console.log(`${user.username} already exists`)
            } else {
                console.log(e);
                throw e;
            }
        }
    }

    function emailToId(email) {
        let user = Accounts.findUserByEmail(email);
        if (!user) {
            console.log(email);
        }
        return user._id;
    }

    function datasetTrans(dataset) {
        dataset.license = dataset.license || 'Unspecified';
        dataset.description = dataset.description || 'Unspecified';
        //publisher email->_id
        dataset.publisher = emailToId(dataset.publisher);

        //dates String->Date
        dataset.datePublished = new Date(dataset.datePublished);
        dataset.dateModified = new Date(dataset.dateModified);

        //acl whitelist
        dataset.metaWhiteList = dataset.metaWhiteList.map(emailToId);
        dataset.contentWhiteList = dataset.contentWhiteList.map(emailToId);
        //dataset.upvoters = [];
        return dataset;
    }

    function importDataset(dataset) {

        if (dataset.distribution[0].fileFormat !== 'File') {
            dataset = datasetTrans(dataset);
            try {
                Datasets.upsert({name: dataset.name}, {$set: dataset});
            }
            catch (e) {
                console.error(dataset);
                console.error(e);
            }
        } else {
            return false;
        }
    }

    function appTrans(app) {
        app.license = app.license || 'Unspecified';
        app.description = app.description || 'Unspecified';
        //publisher email->_id
        app.publisher = emailToId(app.publisher);

        //dates String->Date
        app.datePublished = new Date(app.datePublished);
        app.dateModified = new Date(app.dateModified);

        //acl whitelist
        app.metaWhiteList = app.metaWhiteList.map(emailToId);
        app.contentWhiteList = app.contentWhiteList.map(emailToId);

        if (app.isBasedOnUrl) {
            app.isBasedOnUrl = app.isBasedOnUrl.map(name=> {
                let ds = Datasets.findOne({name});
                if (!ds) {
                    console.error(app.name);
                    console.error(name);
                    return null;
                } else {
                    return ds._id;
                }
            }).filter(id=>id !== null);
        }
        return app;
    }

    function importApp(app) {
        app = appTrans(app);
        try {
            Apps.upsert({name: app.name}, {$set: app});
        }
        catch (e) {
            console.error(app);
            console.error(e);
        }
    }

    ['users', 'datasets', "apps"].forEach(importData);
    Meteor.settings.public.migrate = false;
}

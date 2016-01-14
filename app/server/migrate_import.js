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
            console.log(dataset);
            Datasets.insert(dataset);
        } else {
            return false;
        }
    }

    function appTrans(app) {
        //publisher email->_id
        app.publisher = emailToId(app.publisher);

        //dates String->Date
        app.datePublished = new Date(app.datePublished);
        app.dateModified = new Date(app.dateModified);

        //acl whitelist
        app.metaWhiteList = app.metaWhiteList.map(emailToId);
        app.contentWhiteList = app.contentWhiteList.map(emailToId);

        app.isBasedOnUrl = app.isBasedOnUrl.map(name=> {
            let ds = Datasets.findOne({name});
            if (!ds) {
                console.log(app.name);
                console.log(name);
            }
            return ds._id;
        });
        return app;
    }

    function importApp(app) {
        app = appTrans(app);
        Apps.insert(app);
    }

    ['users', 'datasets', "apps"].forEach(importData);
}

/**
 * Created by xgfd on 11/05/2016.
 */

RemoteDatasets = new orion.collection('remotedatasets', {
    singularName: 'remotedataset', // The name of one of these items
    pluralName: 'remotedatasets', // The name of more than one of these items
    link: {
        // *
        //  * The text that you want to show in the sidebar.
        //  * The default value is the name of the collection, so
        //  * in this case it is not necessary.

        title: 'Remote Datasets'
    },

    /**
     * Tabular settings for this collection
     */
    tabular: {
        // here we set which data columns we want to appear on the data table
        // in the CMS panel
        columns: [
            {
                data: "name",
                title: "Name"
            },
            orion.attributeColumn('createdAt', 'datePublished', 'Published'),
        ]
    }
});

RemoteApps = new orion.collection('remoteapps', {
    singularName: 'remoteapp', // The name of one of these items
    pluralName: 'remoteapps', // The name of more than one of these items
    link: {
        // *
        //  * The text that you want to show in the sidebar.
        //  * The default value is the name of the collection, so
        //  * in this case it is not necessary.

        title: 'Remote Apps'
    },
    /**
     * Tabular settings for this collection
     */
    tabular: {
        // here we set which data columns we want to appear on the data table
        // in the CMS panel
        columns: [
            {
                data: "name",
                title: "Name"
            },
            orion.attributeColumn('createdAt', 'datePublished', 'Published'),
        ]
    }
});

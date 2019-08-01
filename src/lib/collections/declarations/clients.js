/**
 * Created by xgfd on 20/01/2016.
 */
Clients = new orion.collection('client', {
    singularName: 'client', // The name of one of these items
    pluralName: 'clients', // The name of more than one of these items
    link: {
        // *
        //  * The text that you want to show in the sidebar.
        //  * The default value is the name of the collection, so
        //  * in this case it is not necessary.
        title: 'Clients'
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
            {
                data: "key",
                title: "Client Key/ID"
            },
            {
                data: "secret",
                title: "Client secret"
            },
            {
                data: "redirect_uris",
                title: "Redirect/Callback URLs"
            },
            {
                data: "user",
                render: function (val, type, doc) {
                    let publisherId = val;
                    let user = Meteor.users.findOne(publisherId);
                    let publisherName = user ? user.username : "-";
                    return publisherName;
                },
                title: "User"
            },
            orion.attributeColumn('createdAt', 'createdAt', 'Created')
        ]
    }
});

// Meteor.call requires parameters to be of EJSON, passing a collection as it is
// causes a Maximum call stack size exceeded error
// toEJSONSingularType(Clients, Clients.singularName);

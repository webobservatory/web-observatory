Router.configure({
    layoutTemplate: 'layout',
    loadingTemplate: 'loading',
    notFoundTemplate: 'notFound',
    subscriptions () { //using waitOn will cause entry_list to reload every time load-more is clicked
        return [
            Meteor.subscribe(Notifications._name),
            Meteor.subscribe(Groups._name),
            Meteor.subscribe(Meteor.users._name),
            Meteor.subscribe(Licenses._name)
        ]
    }
});

ListController = RouteController.extend({
    template: 'entryList',
    increment: 12,
    //query modifier generation helper
    entriesLimit () {
        return parseInt(this.params.entriesLimit) || this.increment;
    },
    //query modifier generator
    findOptions () {
        return {sort: this.sort, limit: this.entriesLimit()};
    },
    //query generator
    findSelector () {
        let textFilter = search(Session.get('search'));
        let query = {}, _query = this.params.query;

        _.keys(_query).forEach(function (key) {
            console.log(key);
            switch (key) {
                case 'online':
                case 'aclMeta':
                case 'aclContent':
                    query[key] = _query[key].toLowerCase() === 'true'
                    break;
                default:
                    query[key] = _query[key];
            }
        });

        _.extend(query, textFilter);

        ////this function runs twice due to reactivity (subscriptions)
        ////set findSelector to return the computed query straight away
        ////in the second run
        //this.findSelector = function () {
        //    return query;
        //}
        return query;
    },
    //collection of entries (e.g. Apps, Datasets)
    category: null, //overrided in sub controllers
    //displayed entries
    entries () {
        return this.category.find({}, {sort: this.findOptions.sort});
    },
    // helper to generate route names of a given category;
    // a workaround since cannot dynamically concatenate variables in templates
    routes (cat = this.category.singularName) {
        return ['latest', 'page', 'submit', 'edit'].reduce(function (routes, action) {
            routes[action] = cat + '.' + action;
            return routes;
        }, {});
    },
    data () {
        let self = this;
        return {
            category: self.category,
            entries: self.entries(),
            //show search bar in top nav on entry list page
            showSearch: true,
            //show Add button if logged in
            showAdd: true,
            ready: self.ready.bind(self),
            routes: self.routes(),
            //generate path to load next page of entries
            nextPath () {
                if (self.category.find().count() === self.entriesLimit()) {
                    return self.nextPath();
                }
            }
        };
    }
});

RegExp.prototype.toJSONValue = function () {
    let flags = '';
    if (this.global) {
        flags += 'g';
    }
    if (this.ignoreCase) {
        flags += 'i';
    }
    if (this.multiline) {
        flags += 'm';
    }
    return [this.source, flags];
};

RegExp.prototype.typeName = function () {
    return "regex";
};

EJSON.addType("regex", function (str) {
    return new RegExp(...str);
});

function search(searchText) {
    let selector;
    if (searchText) {
        let regExp = buildRegExp(searchText);
        selector = {
            $or: [
                {name: regExp},
                {description: regExp},
                {'distribution.fileFormat': regExp}
            ]
        };
    } else {
        selector = {};
    }

    return selector;
}

//any position
function buildRegExp(searchText) {
    let parts = searchText.trim().split(/[ \-\:]+/);
    return new RegExp("(" + parts.join('|') + ")", "ig");
}

//type ahead
//function buildRegExp(searchText) {
//    let words = searchText.trim().split(/[ \-\:]+/);
//    let exps = _.map(words, function (word) {
//        return "(?=.*" + word + ")";
//    });
//    let fullExp = exps.join('') + ".+";
//    return new RegExp(fullExp, "i");
//}
/***************************
 * entry list
 **************************/
LatestController = ListController.extend({
    subscriptions () {
        return Meteor.subscribe(this.category._name, this.findOptions(), this.findSelector());
    },
    sort: {datePublished: -1, votes: -1, downvotes: 1, _id: -1},
    nextPath () {
        return Router.routes[this.category.singularName + '.latest'].path({entriesLimit: this.entriesLimit() + this.increment});
    }
});

DatasetLatestController = LatestController.extend({
    category: Datasets
});

RemotedatasetLatestController = LatestController.extend({
    category: RemoteDatasets
});

AppLatestController = LatestController.extend({
    category: Apps
});

RemoteappLatestController = LatestController.extend({
    category: RemoteApps
});

GroupLatestController = LatestController.extend({
    category: Groups,
    nextPath () {
        return Router.routes['group.latest'].path({entriesLimit: this.entriesLimit() + this.increment})
    }
});
/***************************
 * entry page
 **************************/
PageController = ListController.extend({
    template: 'entryPage',
    subscriptions() {
        return [Meteor.subscribe('comments', this.params._id),
            Meteor.subscribe(this.category.singularName, this.params._id)]
    },
    data () {
        return {
            comments: Comments.find({entryId: this.params._id}),
            category: this.category,
            entry: this.category.findOne(this.params._id),
            routes: this.routes(this.category.singularName),
            //_isTemplated:true,
        };
    }
});

DatasetPageController = PageController.extend({
    category: Datasets
});

RemotedatasetPageController = PageController.extend({
    category: RemoteDatasets
});

AppPageController = PageController.extend({
    category: Apps
});

RemoteappPageController = PageController.extend({
    category: RemoteApps
});

GroupPageController = PageController.extend({
    category: Groups
});

function templateData(router, col, option) {
    return {
        category: col,
        routes: router.routes(col.singularName),
        entries: router.getEntries(option, col),
        ready: router.ready.bind(router)
    };
}

HomeController = ListController.extend({
    template: 'home',
    increment: 8,
    sort: {votes: -1, downvotes: 1, datePublished: -1, _id: -1},
    subscriptions () {
        return [Datasets, Apps, RemoteDatasets, RemoteApps]
            .map(col=>Meteor.subscribe(col._name, this.findOptions()))
    },
    getEntries(options, col) {
        if (!options)
            options = this.findOptions();
        return col.find({}, options);
    },
    nextPath () {
        return Router.routes['datasets.latest'].path({entriesLimit: this.entriesLimit() + this.increment});
    },
    data () {
        let homeTempData = templateData.bind(null, this);
        let byPubData = {sort: {datePublished: -1}, limit: 8},
            byVote = {sort: {votes: -1}, limit: 8};
        // let self = this;
        return {
            recentDataset: homeTempData(Datasets, byPubData),
            recentApp: homeTempData(Apps, byPubData),
            dataset: homeTempData(Datasets, byVote),
            app: homeTempData(Apps, byVote),
            remoteApp: homeTempData(RemoteApps, byPubData),
            remoteDataset: homeTempData(RemoteDatasets, byPubData),
            _isHome: true,
            _isTemplated: true
        };
    }
});

/****************************************************************
 * Routes
 * Route naming schema {{coll.pluralName}}.{{action}}
 *****************************************************************/

/*
 * Home
 */

Router.route('/', {name: 'home'});

/*
 * Geo API
 */

Router.route(`/geodata`, {
    template: `geoapi`,
    name: `geoapi`,
    subscriptions() {
        // returning a subscription handle or an array of subscription handles
        // adds them to the wait list.
        return Meteor.subscribe('datasets', {});
    },
    data() {
        return {
            category: Datasets,
            col: 'Datasets',
            entries () {
                return this.category.find({});
            }
        };
    },
    //default action
    action() {
        this.render();
    }
});


function setUpRoutes(col, hasRemote = false) {
    let sn = col.singularName, pn = col.pluralName;

    Router.route(`/new/${pn}/:entriesLimit?`, {name: `${sn}.latest`});

    Router.route(`/${pn}/submit`, {
        template: `entrySubmit`,
        name: `${sn}.submit`,
        data() {
            return {category: col, col: pn.substr(0, 1).toUpperCase() + pn.substr(1)};
        }
    });

    Router.route(`/${pn}/:_id`, {name: `${sn}.page`});

    Router.route(`/${pn}/:_id/edit`, {
        name: `${sn}.edit`,
        template: `entryEdit`,
        waitOn () {
            return Meteor.subscribe(`single${sn}`, this.params._id);
        },
        data () {
            return {
                category: col,
                entry: col.findOne()
            };
        }
    });

    if (hasRemote) {
        Router.route(`/new/remote_${pn}/:entriesLimit?`, {name: `remote${sn}.latest`});
        Router.route(`/remote_${pn}/:_id`, {name: `remote${sn}.page`});
    }
}

/*
 * Datasets routes
 */
setUpRoutes(Datasets, true);

/*
 * Apps routes
 */
setUpRoutes(Apps, true);

/*
 * Groups
 */

setUpRoutes(Groups);

/*
 * Accounts
 */

AccountsTemplates.configureRoute('changePwd');
AccountsTemplates.configureRoute('enrollAccount');
AccountsTemplates.configureRoute('forgotPwd');
AccountsTemplates.configureRoute('resetPwd');
AccountsTemplates.configureRoute('signIn', {
    redirect: ()=> {
        let ref = RouterLayer.getQueryParam('return_url'),
            userId = Meteor.userId();
        if (ref && userId) {
            Cookie.set("meteor_user_id", userId);
            Cookie.set("meteor_token", localStorage.getItem("Meteor.loginToken"));
            window.location.replace(ref);
        }
    }
});
AccountsTemplates.configureRoute('signUp');
AccountsTemplates.configureRoute('verifyEmail');

/*
 * Helpers
 */
function requireLogin() {
    if (!Meteor.user()) {
        if (Meteor.loggingIn()) {
            this.render(this.loadingTemplate);
        } else {
            this.render('accessDenied', {data: 'Please sign in.'});
        }
    } else {
        this.next();
    }
}

//Router.onBeforeAction('dataNotFound', {only: 'dataset.page'});
Router.onBeforeAction(requireLogin, {only: ['dataset.submit', 'dataset.edit', 'app.submit', 'app.edit']});

Router.onBeforeAction(function () {
    let {entry, category} = this.data();
    if (Meteor.userId() && entry //should not be necessary
        && ownsDocument(Meteor.userId(), entry)) {
        this.next();
    } else {
        this.render('accessDenied', {data: "You cannot edit others' " + category.singularName});
    }
}, {only: ['dataset.edit', 'app.edit']});

Router.onBeforeAction(function () {//using named function causes an error
    let {entry, category} = this.data();
    if (!entry) {
        this.render('loading');
    } else {
        if (viewsDocument(Meteor.userId(), entry)) {
            this.next();
        } else {
            this.render('accessDenied', {data: "You cannot view this " + category.singularName});
        }
    }
}, {only: ['dataset.page', 'app.page']});

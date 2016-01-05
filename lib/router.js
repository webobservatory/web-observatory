Router.configure({
    layoutTemplate: 'layout',
    loadingTemplate: 'loading',
    notFoundTemplate: 'notFound',
    waitOn () {
        return [
            Meteor.subscribe('notifications'),
            Meteor.subscribe('groups'),
            Meteor.subscribe('userNames'),
        ]
    }
});

ListController = RouteController.extend({
    template: 'entryList',
    increment: 8,
    //query modifier generation helper
    entriesLimit () {
        return parseInt(this.params.entriesLimit) || this.increment;
    },
    fields: {
        'distribution.url': 0,
        'distribution.file': 0,
        'distribution.username': 0,
        'distribution.pass': 0,
    },
    //query modifier generator
    findOptions () {
        return {sort: this.sort, limit: this.entriesLimit(), fields: this.fields};
    },
    //query generator
    findSelector () {
        let query = this.params.query;
        _.keys(query).forEach(function (key) {
            switch (key) {
                case 'online':
                case 'aclMeta':
                case 'aclContent':
                    query[key] = query[key].toLowerCase() === 'true'
                    break;
                default:
                    query[key] = query[key];
            }
        });

        //this function runs twice due to reactivity (subscriptions)
        //set findSelector to return the computed query straight away
        //in the second run
        this.findSelector = function () {
            return query;
        }
        return query;
    },
    //collection of entries (e.g. Apps, Datasets)
    category: null, //overrided in sub controllers
    //update SearchSource collection
    search (text = "") {
        this.searchSource.search(text,
            {
                options: this.findOptions(),
                selector: this.findSelector(),
            });
    },
    //displayed entries
    entries () {
        return this.searchSource.getData({
            options: this.findOptions(),
            transform (matchText, regExp) {
                return matchText.replace(regExp, "<b>$&</b>")
            }
        });
    },
    // helper to generate route names of a given category;
    // a workaround since cannot dynamically concatenate variables in templates
    routes (cat) {
        check(cat, String);
        return ['latest', 'page', 'submit', 'edit'].reduce(function (routes, action) {
            routes[action] = cat + '.' + action;
            return routes;
        }, {});
    },
    data () {
        let self = this;
        return {
            category: self.category,
            entries: self.entries.bind(self),
            searchSource: self.searchSource,
            search: self.search.bind(self),
            //show search bar in top nav on entry list page
            showSearch: true,
            //show Add button if logged in
            showAdd: true,
            ready () {
                return !self.searchSource.getStatus().loading;
            },
            routes: self.routes(self.category.singularName),
            //generate path to load next page of entries
            nextPath () {
                if (self.entries().length === self.entriesLimit())
                    return self.nextPath();
            }
        };
    }
});

/***************************
 * entry list
 **************************/
LatestController = ListController.extend({
    subscriptions () {
        this.searchSource = new SearchSource(this.category.singularName, ['name', 'description'], {
            keepHistory: 1000 * 60 * 5,
            localSearch: true
        });
        this.search();
    },
    sort: {datePublished: -1, _id: -1},
});

DatasetLatestController = LatestController.extend({
    category: Datasets,
    nextPath () {
        return Router.routes['dataset.latest'].path({entriesLimit: this.entriesLimit() + this.increment})
    }
});

AppLatestController = LatestController.extend({
    category: Apps,
    nextPath () {
        return Router.routes['app.latest'].path({entriesLimit: this.entriesLimit() + this.increment})
    }
});

/***************************
 * entry page
 **************************/
PageController = ListController.extend({
    template: 'entryPage',
    data () {
        return {
            comments: Comments.find({entryId: this.params._id}),
            category: this.category,
            entry: this.category.findOne(this.params._id),
            routes: this.routes(this.category.singularName),
        };
    }
});

DatasetPageController = PageController.extend({
    category: Datasets,
    subscriptions () {
        return [Meteor.subscribe('singleDataset', this.params._id, {
            fields: {
                'distribution.url': 0,
                'distribution.file': 0,
                'distribution.username': 0,
                'distribution.pass': 0,
            }
        }),
            Meteor.subscribe('comments', this.params._id)];
    },
});

AppPageController = PageController.extend({
    category: Apps,
    subscriptions () {
        return [Meteor.subscribe('singleApp', this.params._id),
            Meteor.subscribe('comments', this.params._id)];
    },
});

HomeController = ListController.extend({
    template: 'home',
    increment: 4,
    sort: {votes: -1, datePublished: -1, _id: -1},
    subscriptions () {
        return [Meteor.subscribe('datasets', this.findOptions()), Meteor.subscribe('apps', this.findOptions())];
    },
    datasets () {
        return Datasets.find({}, this.findOptions());
    },
    apps () {
        return Apps.find({}, this.findOptions());
    },
    data () {
        let self = this;
        return {
            dataset: {
                category: Datasets,
                routes: self.routes('dataset'),
                entries: self.datasets(),
                ready: self.ready.bind(self)
            },
            app: {
                category: Apps,
                routes: self.routes('app'),
                entries: self.apps(),
                ready: self.ready.bind(self)
            },
        };
    }
});

/****************************************************************
 * Routes
 * Route naming schema {{category}}.{{action}}
 *****************************************************************/

/*
 * Home
 */

Router.route('/', {name: 'home'});

/*
 * Datasets routes
 */

Router.route('/new/datasets/:entriesLimit?', {name: 'dataset.latest'});

Router.route('/datasets/submit', {
    template: 'entrySubmit',
    name: 'dataset.submit',
    data: {col: 'Datasets'}
});

Router.route('/datasets/:_id', {name: 'dataset.page'});

Router.route('/datasets/:_id/edit', {
    name: 'dataset.edit',
    template: 'entryEdit',
    waitOn () {
        return Meteor.subscribe('singleDataset', this.params._id);
    },
    data () {
        return {category: Datasets, entry: Datasets.findOne(this.params._id)};
    }
});

//query
let queryHandlers = {
    mongodb: function () {
        let {selector, skip, limit, sort, project, method, collection} = this.params.query,
            distId = this.params._id;
        let options = {};

        selector = JSON.parse(selector);

        options.limit = parseInt(limit) || 100;

        if (skip) {
            options.skip = parseInt(skip);
        }

        if (sort) {
            options.sort = JSON.parse(sort);
        }

        if (project) {
            options.project = JSON.parse(project);
        }

        //console.log(options);
        let res = this.response;
        Meteor.call(method + 'Query', distId, collection, selector, options, function (error, result) {
            if (error) {
                res.end(JSON.stringify(error));
            } else {
                result.pipe(JSONStream.stringify()).pipe(res);
            }
        });
    },
    mysql: function () {
        let {query, method } = this.params.query,
            distId = this.params._id;

        let res = this.response;
        Meteor.call(method + 'Query', distId, query, function (error, result) {
            if (error) {
                res.end(JSON.stringify(error));
            } else {
                //result.pipe(JSONStream.stringify()).pipe(res);
                res.end(JSON.stringify(result));
            }
        });
    }
};

Router.route('/datasets/:dsId/distributions/:_id', function () {
    let method = this.params.query.method;
    queryHandlers[method].call(this);
}, {
    name: 'dataset.query',
    where: 'server'
});

/*
 * Apps routes
 */

Router.route('/new/apps/:entriesLimit?', {name: 'app.latest'});

Router.route('/apps/submit', {
    template: 'entrySubmit',
    name: 'app.submit',
    data: {col: 'Apps'}
});

Router.route('/apps/:_id', {name: 'app.page'});

Router.route('/apps/:_id/edit', {
    name: 'app.edit',
    template: 'entryEdit',
    waitOn () {
        return Meteor.subscribe('singleApp', this.params._id);
    },
    data () {
        return {category: Apps, entry: Apps.findOne(this.params._id)};
    }
});

/*
 * Accounts
 */

AccountsTemplates.configureRoute('changePwd');
AccountsTemplates.configureRoute('enrollAccount');
AccountsTemplates.configureRoute('forgotPwd');
AccountsTemplates.configureRoute('resetPwd');
AccountsTemplates.configureRoute('signIn');
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
Router.onBeforeAction(requireLogin, {only: ['dataset.submit', 'dataset.edit', /*'dataset.query',*/ 'app.submit', 'app.edit']});

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
    if (Meteor.userId() && entry
        && viewsDocument(Meteor.userId(), entry)) {
        this.next();
    } else {
        this.render('accessDenied', {data: "You cannot view this " + category.singularName});
    }

}, {only: ['dataset.page', 'app.page']});

Router.onBeforeAction(function (req, res, next) {
    //console.log(req);
    // in here next() is equivalent to this.next();
    next();
}, {where: 'server', only: 'dataset.query'});

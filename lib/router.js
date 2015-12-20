Router.configure({
    layoutTemplate: 'layout',
    loadingTemplate: 'loading',
    notFoundTemplate: 'notFound',
    waitOn: function () {
        return [
            Meteor.subscribe('notifications')
        ]
    }
});

ListController = RouteController.extend({
    template: 'entryList',
    increment: 5,
    entriesLimit: function () {
        return parseInt(this.params.entriesLimit) || this.increment;
    },
    findOptions: function () {
        return {sort: this.sort, limit: this.entriesLimit()};
    },
    category: null, //overrided in sub controllers
    entries: null, //overrided in sub controllers
    // helper to generate route names of a given category;
    // a workaround since cannot dynamically concatenate variables in templates
    routes: function (cat) {
        return ['latest', 'page', 'submit', 'edit'].reduce(function (routes, action) {
            routes[action] = cat + '.' + action;
            return routes;
        }, {});
    },
    data: function () {
        var self = this;
        return {
            category: self.category,
            entries: self.entries(),
            ready: self.ready.bind(self),// important! set this
            routes: self.routes(self.category),
            nextPath: function () {
                if (self.entries().count() === self.entriesLimit())
                    return self.nextPath();
            }
        };
    }
});

HomeController = ListController.extend({
    template: 'home',
    sort: {votes: -1, datePublished: -1, _id: -1},
    subscriptions: function () {
        return [Meteor.subscribe('datasets', this.findOptions()), Meteor.subscribe('apps', this.findOptions())];
    },
    datasets: function () {
        return Datasets.find({}, this.findOptions());
    },
    apps: function () {
        return Apps.find({}, this.findOptions());
    },
    data: function () {
        var self = this;
        return {
            dataset: {
                routes: self.routes('dataset'),
                entries: self.datasets(),
                ready: self.ready.bind(self)
            },
            app: {
                routes: self.routes('app'),
                entries: self.apps(),
                ready: self.ready.bind(self)
            },
        };
    }
});

LatestController = ListController.extend({
    sort: {datePublished: -1, _id: -1},
});

DatasetLatestController = LatestController.extend({
    category: "dataset",
    subscriptions: function () {
        return Meteor.subscribe('datasets', this.findOptions());
    },
    entries: function () {
        return Datasets.find({}, this.findOptions());
    },
    nextPath: function () {
        return Router.routes['dataset.latest'].path({entriesLimit: this.entriesLimit() + this.increment})
    }
});

AppLatestController = LatestController.extend({
    category: "app",
    subscriptions: function () {
        return Meteor.subscribe('apps', this.findOptions());
    },
    entries: function () {
        return Apps.find({}, this.findOptions());
    },
    nextPath: function () {
        return Router.routes['app.latest'].path({entriesLimit: this.entriesLimit() + this.increment})
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

Router.route('/datasets/submit', {name: 'dataset.submit'});

Router.route('/datasets/:_id', {
    name: 'dataset.page',
    waitOn: function () {
        return [
            Meteor.subscribe('singleDataset', this.params._id),
            Meteor.subscribe('comments', this.params._id)
        ];
    },
    data: function () {
        return Datasets.findOne(this.params._id);
    }
});

Router.route('/datasets/:_id/edit', {
    name: 'dataset.edit',
    waitOn: function () {
        return Meteor.subscribe('singleDataset', this.params._id);
    },
    data: function () {
        return Datasets.findOne(this.params._id);
    }
});


/*
 * Apps routes
 */

Router.route('/new/apps/:entriesLimit?', {name: 'app.latest'});

Router.route('/apps/submit', {name: 'app.submit'});

Router.route('/apps/:_id', {
    name: 'app.page',
    waitOn: function () {
        return [
            Meteor.subscribe('singleApp', this.params._id),
            Meteor.subscribe('comments', this.params._id)
        ];
    },
    data: function () {
        return Apps.findOne(this.params._id);
    }
});

Router.route('/apps/:_id/edit', {
    name: 'app.edit',
    waitOn: function () {
        return Meteor.subscribe('singleApp', this.params._id);
    },
    data: function () {
        return Apps.findOne(this.params._id);
    }
});


/*
 * Helpers
 */
var requireLogin = function () {
    if (!Meteor.user()) {
        if (Meteor.loggingIn()) {
            this.render(this.loadingTemplate);
        } else {
            this.render('accessDenied');
        }
    } else {
        this.next();
    }
}

Router.onBeforeAction('dataNotFound', {only: 'dataset.page'});
Router.onBeforeAction(requireLogin, {only: 'dataset.submit'});

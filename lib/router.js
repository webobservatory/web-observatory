Router.configure({
  layoutTemplate: 'layout',
  loadingTemplate: 'loading',
  notFoundTemplate: 'notFound',
  waitOn: function() { 
    return [
      Meteor.subscribe('notifications')
    ]
  }
});

EntriesListController = RouteController.extend({
  template: 'datasetsList',
  increment: 5, 
  entriesLimit: function() { 
    return parseInt(this.params.entriesLimit) || this.increment; 
  },
  findOptions: function() {
    return {sort: this.sort, limit: this.entriesLimit()};
  },
  subscriptions: function() {
    this.datasetsSub = Meteor.subscribe('datasets', this.findOptions());
  },
  datasets: function() {
    return Datasets.find({}, this.findOptions());
  },
  data: function() {
    var self = this;
    return {
      datasets: self.datasets(),
      ready: self.datasetsSub.ready,
      nextPath: function() {
        if (self.datasets().count() === self.entriesLimit())
          return self.nextPath();
      }
    };
  }
});

NewEntriesController = EntriesListController.extend({
  sort: {dateModified: -1, _id: -1},
  nextPath: function() {
    return Router.routes.newEntries.path({entriesLimit: this.entriesLimit() + this.increment})
  }
});

BestEntriesController = EntriesListController.extend({
  sort: {votes: -1, dateModified: -1, _id: -1},
  nextPath: function() {
    return Router.routes.bestEntries.path({entriesLimit: this.entriesLimit() + this.increment})
  }
});

Router.route('/', {
  name: 'home',
  controller: NewEntriesController
});

Router.route('/new/:entriesLimit?', {name: 'newEntries'});

Router.route('/best/:entriesLimit?', {name: 'bestEntries'});


Router.route('/datasets/:_id', {
  name: 'datasetPage',
  waitOn: function() {
    return [
      Meteor.subscribe('singleDataset', this.params._id),
      Meteor.subscribe('comments', this.params._id)
    ];
  },
  data: function() { return Datasets.findOne(this.params._id); }
});

Router.route('/datasets/:_id/edit', {
  name: 'datasetEdit',
  waitOn: function() { 
    return Meteor.subscribe('singleDataset', this.params._id);
  },
  data: function() { return Datasets.findOne(this.params._id); }
});

Router.route('/datasets/submit', {name: 'datasetSubmit'});

var requireLogin = function() {
  if (! Meteor.user()) {
    if (Meteor.loggingIn()) {
      this.render(this.loadingTemplate);
    } else {
      this.render('accessDenied');
    }
  } else {
    this.next();
  }
}

Router.onBeforeAction('dataNotFound', {only: 'datasetPage'});
Router.onBeforeAction(requireLogin, {only: 'datasetSubmit'});

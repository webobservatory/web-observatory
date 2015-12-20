Template.datasetPage.helpers({
  comments: function() {
    return Comments.find({entryId: this._id});
  }
});
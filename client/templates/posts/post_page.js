Template.datasetPage.helpers({
  comments: function() {
    return Comments.find({datasetId: this._id});
  }
});
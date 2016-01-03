/**
 * Created by xgfd on 25/12/2015.
 */
// When there is a change to group name, update associated account name
let query = Groups.find();
let handle = query.observeChanges({
    changed: function(groupId, changedField){
        if(changedField.name){
            let groupAccountId = Groups.findOne(groupId).publisher;
            Meteor.users.update({_id: groupAccountId}, {$set: {name: changedField.name}});
        };
    }
});

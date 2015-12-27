/**
 * Created by xgfd on 25/12/2015.
 */
Meteor.users.after.insert(function (userId, user) {
    var profile = user.profile;
    if (profile && profile.isgroup) {
        var group = Groups.insert({publisher: user._id, name: profile.name});
        Meteor.users.update(user._id, {$set: {isGroup: group}, $unset: {'profile.isgroup': ''}});
        Roles.removeUserFromRoles(user._id, ["individual"]);
        Roles.addUserToRoles(user._id, ["group"]);
    }
});
//Accounts.onCreateUser(function (options, user) {
//    var profile = options.profile;
//    if (profile) {
//        if (profile.isgroup) {
//            delete profile.isgroup;
//            user.isGroup = Groups.insert({publisher: user._id, name: profile.name});
//            Roles.removeUserFromRoles( user._id, ["individual"] );
//            Roles.addUserToRoles( user._id ,  ["group"] );
//        }
//        user.profile = options.profile;
//    }
//    return user;
//});

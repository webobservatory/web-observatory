/**
 * Created by xgfd on 19/12/2015.
 */

var App = {
    url: {
        type: String,
        label: "URL",
        regEx: SimpleSchema.RegEx.Url
    },
    github: {
        type: String,
        optional: true,
        label: "Github",
        regEx: SimpleSchema.RegEx.Url
    }
};

//_.extend(App, CreativeWork);

//important, generate whitelist before constructing simpleschema
appWhitelist = _.filter(_.keys(App), function (property) {
    return !App[property].noneditable;
});

_.extend(appWhitelist, Whitelist);

appBlacklist = _.filter(_.keys(App), function (property) {
    return App[property].noneditable;
});

_.extend(appBlacklist, BlackList);

Apps.attachSchema(new SimpleSchema([CreativeWork, App]));

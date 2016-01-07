/**
 * Created by xgfd on 01/01/2016.
 */

//register new message of type 'acceptTerms'
SimpleSchema.messages({acceptTerms: 'You must accept the terms and conditions of this item'});

Template.requestFrom.rendered = function () {
    $('.collapsible').collapsible({
        accordion: false // A setting that changes the collapsible behavior to expandable instead of the default accordion style
    });
};

Template.requestFrom.helpers({
    requestSchema(){
        return new SimpleSchema({
            name: {type: String, label: 'Name', autoform: {readonly: true}},
            username: {
                type: String,
                label: 'Username',
                autoform: {readonly: true}
            },
            email: {
                type: String,
                autoform: {readonly: true}
            },
            organisation: {type: String, label: 'Organisation', optional: true},
            acceptTerms: {
                type: Boolean,
                optional: true,
                label: 'Accept the license of this item',
                custom: function () {
                    if (!this.value) {
                        return "acceptTerms";
                    }
                }
            }
        });
    }
});

Template.requestFrom.events({
    'submit form': function (e, template) {
        e.preventDefault();

        let user = Meteor.user(),
            $target = $(e.target);

        let initiatorId = user._id,
            name = user.profile.name || $target.find('[name=name]').val(),
            username = user.username,
            email = user.email || $target.find('[name=email]').val(),
            organisation = $target.find('[name=organisation]').val(),
            acceptTerms = $target.find('[name=acceptTerms]').prop('checked');

        if (initiatorId && acceptTerms) {
            Meteor.call('createRequestNotification', username, organisation, initiatorId, template.data.entry, template.data.category.singularName);
            Materialize.toast('Request sent!', 4000) // 4000 is the duration of the toast
        }
    }
});

/*
 MongoDB functions
 */

let mongoDep;
Template.MongoDB.helpers({
        getCollectionNames() {
            Meteor.call('mongodbConnect', this._id);
            let collectionNames = ReactiveMethod.call('mongodbCollectionNames', this._id);
            //console.log(collectionNames);
            //change mongoDep after this function return
            Meteor.defer(function () {
                mongoDep.changed(); //feels like coding in Java
            });
            return collectionNames;
        }
    }
);

Template.MongoDB.onCreated(function () {
    mongoDep = new Tracker.Dependency();
});

Template.MongoDB.onRendered(function () {
    //only run at the first time it's rendered, by when collection names are not ready yet
    //use autorun and Tracker.Dependency to sync with getCollectionNames
    //ugly solution
    this.autorun(function () {
        mongoDep.depend();
        $('#collection').material_select();
    });
});

function syntaxHighlight(json) {
    if (typeof json != 'string') {
        json = JSON.stringify(json, undefined, 2);
    }
    json = json.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    return json.replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g, function (match) {
        var cls = 'orange-text text-lighten-2';//number
        if (/^"/.test(match)) {
            if (/:$/.test(match)) {
                cls = 'red-text text-lighten-2';//key
            } else {
                cls = 'teal-text text-lighten-2';//string
            }
        } else if (/true|false/.test(match)) {
            cls = 'blue-text text-lighted-2';//boolean
        } else if (/null/.test(match)) {
            cls = 'pink-text text-lighten-2';//null
        }
        return '<span class="' + cls + '">' + match + '</span>';
    });
}
/*query event handling*/
function queryHandlerFactory(argGen, method) {
    return function (e, template) {
        Session.set('queryResult', null);

        let args = argGen(e, template);

        Meteor.apply(method, args, function (error, result) {
            result = error || result;
            result = syntaxHighlight(result);
            Session.set('queryResult', result);
        });
    }
}

Template.MongoDB.events({
    'click a.btn.modal-trigger': queryHandlerFactory((e, template)=> {
        let distId = template.data._id,
            $target = $(`#${distId}`),
            collection = $target.find('[name=collection]')[0].value;

        let options = {};

        selector = JSON.parse($target.find('[name=selector]')[0].value);

        options.limit = parseInt($target.find('[name=limit]')[0].value) || 100;

        if (skip = $target.find('[name=skip]')[0].value) {
            options.skip = parseInt(skip);
        }

        if (sort = $target.find('[name=sort]')[0].value) {
            options.sort = JSON.parse(sort);
        }

        if (project = $target.find('[name=project]')[0].value) {
            options.project = JSON.parse(project);
        }

        return [distId, collection, selector, options];
    }, 'mongodbQuery'),
});

Template.MySQL.events({
    'click a.btn.modal-trigger': queryHandlerFactory((e, template)=> {
        let distId = template.data._id,
            $target = $(`#${distId}`),
            query = $target.find('[name=query]')[0].value;
        return [distId, query];
    }, 'mysqlQuery')
});

Template.SPARQL.events({
    'click a.btn.modal-trigger': queryHandlerFactory((e, template)=> {
        let distId = template.data._id,
            $target = $(`#${distId}`),
            query = $target.find('[name=query]')[0].value;
        return [distId, query];
    }, 'sparqlQuery')
});

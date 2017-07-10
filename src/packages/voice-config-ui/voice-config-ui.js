/**
 * Created by xgfd on 10/07/2017.
 */

import {Template} from 'meteor/templating';

Template.configureLoginServiceDialogForInnovvoice.helpers({
    siteUrl: function () {
        return Meteor.absoluteUrl();
    }
});

Template.configureLoginServiceDialogForInnovvoice.fields = function () {
    return [
        {property: 'clientId', label: 'Client ID'},
        {property: 'secret', label: 'Client Secret'}
    ];
};
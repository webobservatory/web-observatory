Template.entryPage.helpers({
    appendHash(str) {
        return '#' + str;
    },
    //add dataset id to the distribution object
    distData() {
        this.dsId = Template.parentData().entry._id;
        return this;
    },

    queryResult() {
        return Session.get('queryResult');
    },

    requestFormTitle() {
        if (this.category === Groups) {
            return "Join the group"
        } else {
            return "Request access"
        }
    },

    showProjectApps() {
        let {entry, category} = this;
        if (category === Groups && entry && !!entry.apps) {
            return true;
        } else {
            return false;
        }
    },

    showProjectDatasets() {
        let {entry, category} = this;
        if (category === Groups && entry && !!entry.datasets) {
            return true;
        } else {
            return false;
        }
    },

    getAppsCollection() {
        return Apps;
    },

    getDatasetsCollection() {
        return Datasets;
    },

    appsRoutes() {
        return {
            edit: "app.edit",
            latest: "app.latest",
            page: "app.page",
            submit: "app.submit"
        }
    },

    datasetsRoutes() {
        return {
            edit: "dataset.edit",
            latest: "dataset.latest",
            page: "dataset.page",
            submit: "dataset.submit"
        }
    },

    getProjectApps() {
        let {entry} = this;
        if (entry && entry.apps) {
            return entry.apps.map(id => Apps.findOne(id));
        } else {
            return [];
        }
    },

    getProjectDatasets() {
        let {entry} = this;
        if (entry && entry.datasets) {
            return entry.datasets.map(id => Datasets.findOne(id));
        } else {
            return [];
        }
    },

    showRequestForm(){
        let {entry, category} = this,
            userId = Meteor.userId();

        if (category === Groups) {
            return false; // don't show request form for groups
            // return entry.aclContent && //everyone can join
            //     !_.contains(entry.contentWhiteList, userId);//and not a member already
        } else if (category === Datasets || category === Apps) {
            return !accessesDocument(userId, entry);
        } else {
            return false;
        }

    },

    showDistributions() {
        let {entry, category} = this;
        return category === Datasets &&
            Blaze._globalHelpers.canAccess(entry);
    },

    showInNewTab() {
        let {entry, category} = this;
        let canAccess = Blaze._globalHelpers.canAccess.bind(this, entry);


        //permitted to access
        if (canAccess()) {
            // app, group
            if ((category === Apps || category === RemoteApps) && entry.url.indexOf("https") === 0) {
                return entry.url;
            } else {
                return false;
            }
            //dataset with only one html distribution
            if (category === Datasets &&
                entry.distribution &&
                entry.distribution.length === 1 &&
                entry.distribution[0].fileFormat === 'HTML') {
                return entry.distribution[0].url;
            } else {
                return false;
            }
        } else {
            return false;
        }
    }
});

function urlToLink() {
    //transform type=url to link
    $('[type=url]').after(function () {
        let url = this.value;
        if (url) {
            $(this).hide();
            return "<a href='" + url + "'>" + url + "</a>";
        }
    });
}

function liceToLink() {
    //transform license to link
    let $lice = $('select[name=license]'),
        eltId = $lice.attr('id'),
        $wrapper = $lice.closest('.row'),
        lice = $wrapper.find('.select-dropdown').val().toLowerCase();

    let $row = $("<div class='col s12'></div>");
    if (defaultLicenses.has(lice)) {
        $row.append(`<a class="btn" href="http://choosealicense.com/licenses/${lice}" target="_blank">Show license</a>`);
    }

    let liceObj = Licenses.findOne({name: lice});
    if (liceObj) {
        if (liceObj.url) {
            $row.append(`<a class="btn" href="${liceObj.url}" target="_blank">Show license</a>`);
        } else {
            $row.append(`<a id="liceModalTrigger" class="btn modal-trigger" href="#liceModal">Show license</a>`);
            $row.append(`<div id="liceModal" class="modal">
                            <div class="modal-content">
                              <p>${liceObj.text}</p>
                            </div>
                            <div class="modal-footer">
                              <a href="#!" class=" modal-action modal-close waves-effect waves-green btn-flat">Close</a>
                            </div>
                          </div> `);
        }
    } else {
        //should not reach here
    }

    $wrapper.append($row);
}

Template.entryPage.onCreated(function () {
    let data = Template.currentData();
    if (data.category === Groups) {
        this.subscribe('apps');
        this.subscribe('datasets');
    }
});

Template.entryPage.rendered = function () {
    //$('ul.tabs').tabs();
    // the "href" attribute of .modal-trigger must specify the modal ID that wants to be triggered

    urlToLink();
    $('ul li.tab.col a')[0].click();//active the first tab
    //liceToLink();

    //$('.modal-trigger').leanModal();

    //$('#amqpModalTrigger').leanModal({
    //    complete: function () {
    //        Session.set('queryResult', null);
    //    }
    //});
};

Template.entryPage.events({
    'click a.modal-action.modal-close': function (e) {
        Streamy.emit('amqp_end');
    }
});

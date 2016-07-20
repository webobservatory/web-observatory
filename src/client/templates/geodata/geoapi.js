/**
 * Created by xgfd on 20/07/2016.
 */

Template.geoapi.events({});

Template.geoapi.onRendered(function () {

    $("#preview-map").mapPreview({
        onChange: function () {
            $("#code").text(this.generateCode());
        }
    });
});

Template.geoapi.events({
    'change .selectpicker': function (e) {
        let student = $(".selectpicker").val();
        console.log(student);
    }
});

let renderTimeout = false;
Template.geodata.onRendered(()=> {
    if (renderTimeout !== false) {
        Meteor.clearTimeout(renderTimeout);
    }
    renderTimeout = Meteor.setTimeout(function () {
        $('.selectpicker').selectpicker("refresh");
        renderTimeout = false;
    }, 10);
});

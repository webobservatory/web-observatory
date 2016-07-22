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

let selected = [];
Template.geoapi.events({
    'change .selectpicker': (e)=> {

        let previous = selected;

        selected = $(e.target).val();
        let deselected = _.difference(previous, selected);
        let added = _.difference(selected, previous);
        // console.log(previous, selected, deselected, added);

        added.forEach((id)=> {
            // console.log('text', getTitle(id));
            let title = getTitle(id);
            $("#preview-map").mapPreview("addLayerById", id, {title});
        });
        // deselected.forEach((id)=>$("#preview-map").mapPreview("removeLayerById", id));
    }
});

function getTitle(id) {
    return $(`option[value=${id}]`).text();
}

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

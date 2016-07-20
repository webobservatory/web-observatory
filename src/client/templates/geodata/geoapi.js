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

    console.log('preview');
});

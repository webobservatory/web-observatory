/**
 * Created by xgfd on 01/01/2016.
 */


Template.entryList.rendered = function () {
    let options = [
        {
            selector: 'a.load-more',
            offset: 15,
            //on display tooltip won't dismiss after loading more, manually hide any on display tooltip
            callback: "$('a.load-more').click(); $('.material-tooltip[style]').hide();",
            //repeat not working yet, wait for update
            repeat: true
        },
    ];
    Materialize.scrollFire(options);
};

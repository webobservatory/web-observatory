/**
 * Created by xgfd on 01/01/2016.
 */
Template.entryList.helpers({
    //entries() {
    //    return this.category.find(search(Session.get('search')), {sort: this.findOptions.sort});
    //}
});

Template.entryList.rendered = function () {

    //this.autorun(()=> {
    //    console.log(this.data.findOptions);
    //    this.subscribe(this.data.category.pluralName, this.data.findOptions, search(Session.get('search')));
    //});

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
    //Materialize.scrollFire(options);
};



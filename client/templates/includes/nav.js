Template.nav.helpers({
    activeRouteClass: function (/* route names */) {
        var args = Array.prototype.slice.call(arguments, 0);
        args.pop();

        var active = _.any(args, function (name) {
            return Router.current() && Router.current().route.getName() === name
        });

        return active && 'active';
    },
    addItem: function () {
        return "Add " + this.category;
    }
});

Template.nav.rendered = function () {
    $(".button-collapse").sideNav();
};

Template.nav.events({
    "keyup #search": _.throttle(function(e) {
        var text = $(e.target).val().trim();
        this.search(text);
    }, 200)
});
/**
 * Created by xgfd on 21/12/2015.
 */
var sources = {dataset: Datasets, app: Apps};

_.keys(sources).forEach(function (key) {
    SearchSource.defineSource(key, function (searchText, options) {
        if (!options) {
            options = {
                options: {sort: {vote: -1}, limit: 20},
                selector: {}
            };
        }
        var Collection = sources[key];
        var selector = options.selector;
        if (searchText) {
            var regExp = buildRegExp(searchText);
            _.extend(selector, {$or: [{name: regExp}, {description: regExp}]});
        }
        console.log(selector);
        return Collection.find(selector, options.options).fetch();
    });
});

//any position
function buildRegExp(searchText) {
    var parts = searchText.trim().split(/[ \-\:]+/);
    return new RegExp("(" + parts.join('|') + ")", "ig");
}

//type ahead
//function buildRegExp(searchText) {
//    var words = searchText.trim().split(/[ \-\:]+/);
//    var exps = _.map(words, function (word) {
//        return "(?=.*" + word + ")";
//    });
//    var fullExp = exps.join('') + ".+";
//    return new RegExp(fullExp, "i");
//}

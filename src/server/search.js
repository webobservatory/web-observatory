/**
 * Created by eugene on 11/02/2016.
 */

function buildRegExp(keywords) {
    // this is a dumb implementation
    var parts = keywords.trim().split(/[ \-\:]+/);
    return new RegExp("(" + parts.join('|') + ")", "ig");
}

function containAny(keywords) {
    return keywords ? {$or: [{name: buildRegExp(keywords)}]} : {};
}

function fedSearch(colls, keywords, options) {
    options = options || {limit: 10};

    let fedResult = colls
        .map(col=> col.find(containAny(keywords), options).fetch())//fetch collection
        .reduce((a, b)=>a.concat(b));//concat results
    return fedResult;
}

let searchDatasets = fedSearch.bind(null, [Datasets, RemoteDatasets]),
    searchApps = fedSearch.bind(null, [Apps, RemoteApps]);

SearchSource.defineSource('apps', searchApps /*function (keywords, options) {
 var options = {limit: 10};

 if (keywords) {
 var regExp = buildRegExp(keywords);
 var selector = {
 $or: [
 {name: regExp},
 ]
 };

 return Apps.find(selector, options).fetch();
 } else {
 return Apps.find({}, options).fetch();
 }
 }*/);

SearchSource.defineSource('datasets', searchDatasets/*function (keywords, options) {
 var options = {limit: 10};

 if (keywords) {
 var regExp = buildRegExp(keywords);
 var selector = {
 $or: [
 {name: regExp},
 ]
 };

 return Datasets.find(selector, options).fetch();
 } else {
 return Datasets.find({}, options).fetch();
 }
 }*/);


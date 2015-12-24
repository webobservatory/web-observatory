// check that the userId specified owns the documents
ownsDocument = function (userId, doc) {
    return doc && doc.publisher === userId || Roles.userHasRole(userId, "admin");
};

viewsDocument = function (userId, doc) {
    if (doc) {
        return doc.aclMeta // publicly listed entries
            || ownsDocument(userId, doc) // own entries
            || (doc.metaWhiteList && _.contains(doc.metaWhiteList, userId)) // white-listed user
            || Groups.find({members: userId}).fetch().some(group => viewsDocument(group.publisher, doc)); // member of white-listed groups
    } else {
        return false;
    }
};

accessesDocument = function (userId, doc) {
    if (doc) {
        return doc.aclContent
            || ownsDocument(userId, doc)
            || (doc.contentWhiteList && _.contains(doc.contentWhiteList, userId))
            || Groups.find({members: userId}).fetch().some(group => accessesDocument(group.publisher, doc)); // member of white-listed groups
    } else {
        return false;
    }
};

visibleDocumentPublish = function (userId) {

    var query = {$or: [{aclMeta: true}, {metaWhiteList: userId}, {publisher: userId}]};//individual permission

    if (userId) {
        var groups = Groups.find({members: userId});
        //group permission
        groups.forEach(function (group) {
            query.$or.push({metaWhiteList: group.publisher});
            return previous;
        });
    } else {
        query = {$or: [{aclMeta: true}]};
    }

    return query;
};

isMember = function (userId, doc) {
    return doc && doc.members && _.contains(doc.members, userId);
};

//set @Role's permission according to @colRules
//@colRules is of the form {collection_name: [allowed_fields]}
setCollectionGrants = function (Role, colRules) {
    for (var colName in colRules) {
        if (colRules.hasOwnProperty(colName)) {
            setRuleArray(Role, colName, colRules[colName]);
        }
    }
};

function setRuleArray(Role, colName, fields) {
    if (!Array.isArray(fields)) {
        fields = [fields];
    }

    fields.forEach(function (field) {
        Role.allow('collections.' + colName + '.' + field, true);
    });
};

Options.set('defaultRoles', ['individual']);
/*
 * First you must define the role
 */
var Atom = new Roles.Role('individual'),
    allows = {
        datasets: ['index', 'insert', 'update', 'remove', 'showCreate', 'showUpdate', 'showRemove'],
        apps: ['index', 'insert', 'update', 'remove', 'showCreate', 'showUpdate', 'showRemove'],
        comments: ['index', 'update','showUpdate'],
        groups: ['index']
    };

setCollectionGrants(Atom, allows);

Atom.helper('collections.datasets.indexFilter', ownsDocument);
Atom.helper('collections.apps.indexFilter', ownsDocument);
Atom.helper('collections.comments.indexFilter', ownsDocument);
Atom.helper('collections.groups.indexFilter', isMember);

//forbidden fields
Atom.helper('collections.datasets.forbiddenFields', datasetBlackList);
Atom.helper('collections.apps.forbiddenFields', appBlacklist);
Atom.helper('collections.comments.forbiddenFields', ['publisher', 'entryId', 'submitted']);

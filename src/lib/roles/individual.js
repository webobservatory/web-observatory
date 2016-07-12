Options.set('defaultRoles', ['individual']);
/*
 * First you must define the role
 */
let Atom = new Roles.Role('individual'),
    grants = {
        entries: {
            access(entry) {
                return accessesDocument(this.userId, entry);
            }
        },
        datasets: ['index', 'insert', 'update', 'remove', 'showUpdate', 'showRemove'],
        apps: ['index', 'insert', 'update', 'remove', 'showUpdate', 'showRemove'],
        client: ['index', 'insert', 'update', 'remove', 'showCreate', 'showUpdate', 'showRemove'],
        licenses: ['index', 'insert', 'update', 'remove', 'showCreate', 'showUpdate', 'showRemove'],
        comments: ['index'],
        groups: ['index']
    };

setCollectionGrants(Atom, grants);

Atom.helper('collections.datasets.indexFilter', ownsDocumentQuery);
Atom.helper('collections.apps.indexFilter', ownsDocumentQuery);
Atom.helper('collections.client.indexFilter', ownsDocumentQuery);
Atom.helper('collections.licenses.indexFilter', ownsDocumentQuery);
Atom.helper('collections.comments.indexFilter', ownsDocumentQuery);
Atom.helper('collections.groups.indexFilter', isMemberQuery);

//forbidden fields
Atom.helper('collections.datasets.forbiddenFields', omitFields);
Atom.helper('collections.apps.forbiddenFields', omitFields);
//Atom.helper('collections.licenses.forbiddenFields', ['publisher', 'datePublished']);
//Atom.helper('collections.client.forbiddenFields', ['clientSecret', 'publisher', 'datePublished']);
//Atom.helper('collections.comments.forbiddenFields', ['publisher', 'entryId', 'submitted']);

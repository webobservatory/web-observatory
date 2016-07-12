/**
 * Created by xgfd on 24/12/2015.
 */

let Molecule = new Roles.Role('group'),
    grants = {
        entries: {
            access(entry) {
                return accessesDocument(this.userId, entry);
            }
        },
        groups: ['index', 'update', 'showUpdate'],
        datasets: ['index', 'insert', 'update', 'remove', 'showUpdate', 'showRemove'],
        apps: ['index', 'insert', 'update', 'remove', 'showUpdate', 'showRemove'],
        licenses: ['index', 'insert', 'update', 'remove', 'showCreate', 'showUpdate', 'showRemove'],
        client: ['index', 'insert', 'update', 'remove', 'showCreate', 'showUpdate', 'showRemove']
    };

setCollectionGrants(Molecule, grants);

Molecule.helper('collections.groups.indexFilter', ownsDocumentQuery);
Molecule.helper('collections.datasets.indexFilter', ownsDocumentQuery);
Molecule.helper('collections.apps.indexFilter', ownsDocumentQuery);
Molecule.helper('collections.client.indexFilter', ownsDocumentQuery);
Molecule.helper('collections.licenses.indexFilter', ownsDocumentQuery);

//forbidden fields
Molecule.helper('collections.datasets.forbiddenFields', omitFields);
Molecule.helper('collections.apps.forbiddenFields', omitFields);
Molecule.helper('collections.licenses.forbiddenFields', ['publisher', 'datePublished']);
Molecule.helper('collections.client.forbiddenFields', ['secret', 'user', 'dateCreated']);
//Molecule.helper('collections.comments.forbiddenFields', ['publisher', 'entryId', 'submitted']);

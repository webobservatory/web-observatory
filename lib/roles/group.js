/**
 * Created by xgfd on 24/12/2015.
 */

var Molecule = new Roles.Role('group'),
    allows = {
        groups: ['index', 'update', 'showUpdate'],
        datasets: ['index', 'insert', 'update', 'remove', 'showCreate', 'showUpdate', 'showRemove'],
        apps: ['index', 'insert', 'update', 'remove', 'showCreate', 'showUpdate', 'showRemove'],
    };

setCollectionGrants(Molecule, allows);

Molecule.helper('collections.groups.indexFilter', ownsDocument);
Molecule.helper('collections.datasets.indexFilter', ownsDocument);
Molecule.helper('collections.apps.indexFilter', ownsDocument);



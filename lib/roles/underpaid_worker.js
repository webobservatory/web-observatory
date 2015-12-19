/*
 * First you must define the role
 */
UnderpaidWorker = new Roles.Role('underpaidWorker');

/**
 * Allow the actions of the collection
 */
UnderpaidWorker.allow('collections.datasets.index', true); // Allows the role to see the link in the sidebar
UnderpaidWorker.allow('collections.datasets.insert', false); // Allows the role to insert documents
UnderpaidWorker.allow('collections.datasets.update', true); // Allows the role to update documents
UnderpaidWorker.allow('collections.datasets.remove', true); // Allows the role to remove documents
UnderpaidWorker.allow('collections.datasets.showCreate', false); // Makes the "create" button visible
UnderpaidWorker.allow('collections.datasets.showUpdate', true); // Allows the user to go to the update view
UnderpaidWorker.allow('collections.datasets.showRemove', true); // Shows the delete button on the update view

/**
 * Set the index filter.
 * This part is very important and sometimes is forgotten.
 * Here you must specify which documents the role will be able to see in the index route
 */
UnderpaidWorker.helper('collections.datasets.indexFilter', {}); // Allows the role to see all documents

/**
 * Allow the actions of the collection
 */
UnderpaidWorker.allow('collections.comments.index', true); // Allows the role to see the link in the sidebar
UnderpaidWorker.allow('collections.comments.insert', false); // Allows the role to insert documents
UnderpaidWorker.allow('collections.comments.update', true); // Allows the role to update documents
UnderpaidWorker.allow('collections.comments.remove', true); // Allows the role to remove documents
UnderpaidWorker.allow('collections.comments.showCreate', false); // Makes the "create" button visible
UnderpaidWorker.allow('collections.comments.showUpdate', true); // Allows the user to go to the update view
UnderpaidWorker.allow('collections.comments.showRemove', true); // Shows the delete button on the update view

/**
 * Set the index filter.
 * This part is very important and sometimes is forgotten.
 * Here you must specify which documents the role will be able to see in the index route
 */
UnderpaidWorker.helper('collections.comments.indexFilter', {}); // Allows the role to see all documents



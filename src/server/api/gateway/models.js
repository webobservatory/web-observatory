/**
 *
 * Created by xgfd on 02/06/2016.
 */

const models = {
    user: {
        identity: 'user',
        tableName: 'users',
        connection: 'def',
        schema: true,
        policies: 'loggedIn',
        attributes: {
            username: {
                type: 'string',
                required: true
            },
            emails: {
                type: 'array'
            }
        }
    }
};

export default models;
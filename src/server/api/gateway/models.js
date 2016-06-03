/**
 *
 * Created by xgfd on 02/06/2016.
 */

const models = {
    users: {
        identity: 'users',
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
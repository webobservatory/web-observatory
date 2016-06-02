/**
 *
 * Created by xgfd on 02/06/2016.
 */

const models = {
    user: {
        identity: 'users',
        connection: 'def',
        schema: true,
        policies: 'loggedIn',
        beforeCreate: (val, next)=> next(),
        beforeUpdate: (val, next)=> next(),
        attributes: {
            username: {
                type: 'string',
                required: true
            },
            emails: [{
                address: {
                    type: 'string',
                    required: true
                }
            }],
            email: ()=>this.emails[0],
            services: {
                password: {
                    bcrypt: {
                        type: 'string',
                        required: true
                    }
                }
            }
        }
    }
};

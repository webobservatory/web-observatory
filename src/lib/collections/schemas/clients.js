/**
 * Created by xgfd on 20/01/2016.
 */
// import crypto from 'crypto'

function keyGen(str) {
    return CryptoJS.MD5(str + Math.random()).toString(CryptoJS.enc.Hex);
}

let ClientSchema = new SimpleSchema({

    name: {
        type: String,
        label: 'Name'
    },

    user: orion.attribute('createdBy'),

    publisher: orion.attribute('createdBy'),

    key: {
        type: String,
        denyUpdate: true,
        autoValue(){
            if (this.isInsert) {
                let user = Meteor.userId();
                return keyGen(user + '-');
            } else {
                this.unset(); // Prevent user from supplying their own value
            }
        },
        autoform: {
            omit: true,
            readonly: true
        }
    },

    secret: {
        type: String,
        denyUpdate: true,
        autoValue() {
            let key = this.field("key");
            if (key.isSet) {
                let user = Meteor.userId();
                return keyGen(key.value + user);
            } else {
                this.unset();
            }
        },
        autoform: {
            omit: true,
            readonly: true
        }
    },

    createdAt: orion.attribute('createdAt'),
    updatedAt: orion.attribute('updatedAt'),

    redirect_uris: {
        type: [String],
        label: 'Callback URLs',
        optional: true
    }
});

Clients.attachSchema(ClientSchema);
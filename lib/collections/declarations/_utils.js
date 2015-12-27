/**
 * Created by xgfd on 26/12/2015.
 */

//Declare a newe EJSON type @typeName with only one instance @singular
toEJSONSingularType = function (singular, typeName) {

    check(typeof singular, 'object');//check(singular, Ojbect) may give expected plain object error
    check(singular.typeName, undefined);
    check(singular.toJSONValue, undefined);
    check(typeName, String);

    singular.typeName = function () {
        return typeName;
    };

    //the return value doesn't matter since the custom type always return one value
    singular.toJSONValue = function () {
        return typeName;
    };

    EJSON.addType(typeName, function () {
        return singular;
    });
};


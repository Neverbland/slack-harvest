var Sequelize   =       require('sequelize'),
    instances   =       {},
    _           =       require('lodash'),
    model       =        {
        name : {
            type : Sequelize.STRING,
            field: 'name'
        },
        value : {
            type : Sequelize.TEXT,
            field : 'value'
        }
    },
    extendModel = function (Config) {
        Config.buildObject = function (obj, namespaceArray, pos) {
            var output = {};
            output[namespaceArray[pos]] = obj;
            if (pos > 0) {
                output = Config.buildObject(output, namespaceArray, (pos - 1));
            }

            return output;
        };
        
        /**
         * Gets config params matching given namespace and applies callback on it
         * 
         * @param   {String}        namespace
         * @param   {Function}      callback        Takes one param, the config results
         * @returns {undefined}
         */
        Config.getConfigMatching = function (namespace, callback)
        {
            var that = this;
            that.find({
                where : {
                    name : {
                        $like : namespace + '.' + '%'
                    }
                }
            }).then(function (results) {
                var returnResults = {};
                _.each(results, function (result) {
                    if (typeof result.name !== 'string') {
                        return;
                    }
                    var name = result.name,
                        value = result.value,
                        splitName = name.split('.'),
                        remainingLength = splitName.length - 1,
                        resultObject = that.buildObject(value, splitName, remainingLength)
                    ;

                    _.defaultsDeep(returnResults, resultObject);
                });

                callback(returnResults[namespace]);
            });
        };
    };
;


module.exports = function (key, sequelize) {
    if (!!instances[key]) {
        return instances[key];
    } else if (!sequelize) {
        return null;
    } else {
        instances[key] = sequelize.define('config', model, {
            freezeTableName : true
        });
        
        extendModel(instances[key]);
        
        instances[key].sync({
            force : false
        });
        
        return instances[key];
    }
};
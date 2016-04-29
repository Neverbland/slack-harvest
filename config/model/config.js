var Sequelize   =       require('sequelize'),
    sequelize   =       require('./../../app/services/db')('default'),
    _           =       require('lodash'),
    model       =        (function () {
        if (sequelize) {
            return {
                name : {
                    type : Sequelize.STRING,
                    field: 'name'
                },
                value : {
                    type : Sequelize.TEXT,
                    field : 'value'
                }
            };
        } else {
            return null;
        }
    })(),    
    Config = model ? sequelize.define('config', model, {
        freezeTableName : true
    }) : null
;

if (Config) {
    Config.buildObject = function (obj, namespaceArray, pos) {
        var output = {};
        output[namespaceArray[pos]] = obj;
        if (pos > 0) {
            output = buildObject(output, namespaceArray, (pos - 1));
        }

        return output;
    },
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
                var name = result.name,
                    value = result.value,
                    resultObject = that.buildObject(value, name.split('.'), (name.split('.').length -1))
                ;
                
                _.defaultsDeep(returnResults, resultObject);
            });
            
            callback(returnResults[namespace]);
        });
    };
}

module.exports = Config;
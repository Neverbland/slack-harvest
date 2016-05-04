/*jshint node: true*/
'use strict';

var 
    Q           =       require('q')
;

module.exports = function (config)
{
    var def = Q.defer();
    
    config.additional.value2 = "Test 2";
    config.base.value2 = "Test 3";
    
    def.resolve();
    
    return def.promise;
};
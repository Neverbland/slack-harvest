/*jshint node: true*/
'use strict';

var 
    expect          =   require('chai').expect,
    path            =   ':memory:',
    dbMock          =   require('./../../../mock/db/index.js')(path),
    Config          =   require('./../../../../config/model/config.js')('test', dbMock),
    fs              =   require('fs')
;

describe('Config model test', function () {
    
    describe('Config.getConfigMatching', function () {
        it('Should provide proper config object for given values.', function () {
            var 
                namespace = 'test',
                testName = namespace + '.value.expected',
                testValue = 'This is value',
                expected = {
                    test : {
                        value : {
                            expected : testValue
                        }
                    }
                }
            ;
            
            
            Config.create({
                name : testName,
                value : testValue
            }).then(function () {
                Config.getConfigMatching(namespace, function (result) {
                    expect(result).to.deep.equal(expected.test);
                });
            });
        });
    });
});
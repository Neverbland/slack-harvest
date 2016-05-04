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
    
    describe('Config.buildObject', function () {
        it('Should create a namespaced object from given string with namespace parts separated by dots and given value.', function () {
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
                },
                result = Config.buildObject(testValue, testName);
                
                expect(result).to.deep.equal(expected);
            ;
        });
    });
    
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
                    expect(result).to.deep.equal(expected[namespace]);
                });
            });
        });
    });
});
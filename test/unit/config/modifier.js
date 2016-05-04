/*jshint node: true*/
'use strict';

var 
    expect          =   require('chai').expect,
    modifierPath    =   __dirname + '/../../mock/config_providers',
    modifier        =   require('./../../../config/modifier'),
    config          =   {
        base : {
            value1 : "Test 1",
            value2 : "Test 2"
        },
        additional : {
            value1 : "Test 1"
        }
    },
    expected        =   {
        base : {
            value1 : "Test 1",
            value2 : "Test 3"
        },
        additional : {
            value1 : "Test 1",
            value2 : "Test 2"
        }
    }
;


describe('Config modifier', function () {
    it ('Should override given config object with propper values and call callback after done.', function () {
        modifier(config, function () {
            
            expect(config).to.be.deep.equal(expected);
        }, modifierPath);
    });
});

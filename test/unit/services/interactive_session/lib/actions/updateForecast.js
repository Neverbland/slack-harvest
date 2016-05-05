/*jshint node: true*/
'use strict';

var expect          = require('chai').expect,
    action          = 'updateForecast',
    rewire          = require('rewire'),
    i18n            = require('i18n'),
    path            = ':memory:',
    dbMock          = require('./../../../../../mock/db/index.js')(path),
    Config          = require('./../../../../../../config/model/config.js')('test', dbMock),
    updateForecast  = rewire('./../../../../../../app/services/interactive_session/lib/actions/updateForecast'),
    step            = updateForecast.getStep(1)
;

updateForecast.__set__('Config', Config); 

describe('Interactive session: updateForecast', function () {
    
    it('Should return a valid action name', function () {
        expect(updateForecast.getActionName()).to.be.equal(action);
    });
    
    
    describe('updateForecast.execute', function () {
        it('Should return valid response for valid accountId input parameter', function () {
            var params = {
                userId : 1,
                action : action,
                name : "accountId 12345"
            };

            step.execute(params, function (error, response) {
                expect(error).to.be.null;
                expect(response.constructor.name).to.be.equal('UserSessionStep');
            });
        }); 


        it('Should return valid response for valid token input parameter', function () {
            var params = {
                userId : 1,
                action : action,
                name : "authorization Bearer 12345.Yp50pQPTzN1cXphovN-D-esTtpRsAKveDl0CnKgSR-73-tzSbS79_BJBEOStzrXmuWxV5JZsHsRyuRzTqhXxS0"
            };

            step.execute(params, function (error, response) {
                expect(error).to.be.null;
                expect(response.constructor.name).to.be.equal('UserSessionStep');
            });
        }); 


        it('Should return error if invalid parameter name provided', function () {
            var params = {
                userId : 1,
                action : action,
                name : "invalid 12345"
            };

            step.execute(params, function (error, response) {
                expect(response).to.be.null;
                expect(error).to.be.equal(i18n.__('Invalid parameter name!'));
            });
        }); 


        it('Should return error if invalid parameter value provided', function () {
            var params = {
                userId : 1,
                action : action,
                name : "authorization Bearer 12345 .Yp50pQPTzN1cXphovN-D-esTtpRsAKveDl0Cn"
            };

            step.execute(params, function (error, response) {
                expect(response).to.be.null;
                expect(error).to.be.equal(i18n.__('Invalid Token!'));
            });
        }); 
    });
    
    
});

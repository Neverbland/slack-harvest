/*jshint node: true*/
'use strict';

var expect          = require('chai').expect,
    action          = 'assignPerson',
    rewire          = require('rewire'),
    i18n            = require('i18n'),
    path            = ':memory:',
    dbMock          = require('./../../../../../mock/db/index.js')(path),
    Config          = require('./../../../../../../config/model/config.js')('test', dbMock),
    assignPerson  = rewire('./../../../../../../app/services/interactive_session/lib/actions/assignPerson'),
    step            = assignPerson.getStep(1)
;

assignPerson.__set__('Config', Config); 

describe('Interactive session: assignPerson', function () {
    
    it('Should return a valid action name', function () {
        expect(assignPerson.getActionName()).to.be.equal(action);
    });
    
    
    describe('assignPerson.execute', function () {
        it('Should return valid response for valid slack name/harvest id input parameters.', function () {
            var params = {
                userId : 1,
                action : action,
                name : "slack_name 12345"
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
                name : "invalid12345"
            };

            step.execute(params, function (error, response) {
                expect(response).to.be.null;
                expect(error).to.be.equal(i18n.__('Invalid parameter slackName provided!'));
            });
        }); 


        it('Should return error if invalid parameter value provided', function () {
            var params = {
                userId : 1,
                action : action,
                name : "slack^invalid 12345"
            };

            step.execute(params, function (error, response) {
                expect(response).to.be.null;
                expect(error).to.be.equal(i18n.__('Invalid parameter slackName provided!'));
            });
        }); 
    });
    
    
});

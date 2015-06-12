'use strict';

var expect          = require('chai').expect,
    user_session    = require('./../../../../../app/services/interactive_session/lib/user_session.js'),
    _               = require('lodash')
;


describe('user_session', function () {
    
    describe('user_session.create', function () {
        it('Should create a new instance of UserSession', function () {
            expect(user_session.create()).to.not.equal(user_session.create());
        });
    });
    
    describe('user_session.getDefault', function () {
        it('Should return same instance of UserSession', function () {
            expect(user_session.getDefault()).to.equal(user_session.getDefault());
        });
    });
    
    describe('user_session.error', function () {
        it('Should reference the constructor of InvalidOptionError', function () {
            expect((new user_session.error()).constructor.name).to.be.equal('InvalidOptionError');
        });
    });
    
    
    describe('user_session.UserSession.createStep', function () {
        it('Should create a new UserSessionStep instance', function () {
            var action = 'action_name',
                userId = 12345,
                options = {
                    some : 'option'
                },
                step = user_session.getDefault().createStep(userId, options, action);
            ;
            expect(step.constructor.name).to.be.equal('UserSessionStep');
        });
    });
    
    
    describe('user_session.UserSession.addStep', function () {
        it('Should add an UserSessionStep instance to user session', function () {
            var action = 'action_name',
                userSession = user_session.getDefault(),
                session,
                userId = 12345,
                options = {
                    some : 'option'
                },
                step = userSession.createStep(userId, options, action);
            ;
            
            session = userSession.addStep(userId, step);
            expect(session.countSteps(userId)).to.equal(1);
            expect(session).to.equal(userSession);
            expect(session.hasSession(userId)).to.equal(true);
        });
    });
    
    
    describe('user_session.UserSession.getStep', function () {
        it('Should return an UserSessionStep instance', function () {
            var userSession = user_session.getDefault(),
                userId = 12345,
                step = userSession.getStep(userId)
            ;
            expect(step).to.equal(userSession.getStep(userId, 1));
            expect(step.constructor.name).to.be.equal('UserSessionStep');
        });
    });
    
    
    describe('user_session.UserSession.clear', function () {
        it('Should clear all steps for the session and return the same instance of user session object', function () {
            var userSession = user_session.getDefault(),
                session,
                userId = 12345
            ;
            
            session = userSession.clear(userId);
            expect(session).to.equal(userSession);            
        });
    });
    
    
    describe('user_session.UserSessionStep', function () {
        it('Should return a valid option, param etc.', function () {
            var action = 'action_name',
                userSession = user_session.getDefault(),
                userId = 12345,
                sameStep,
                options = {
                    some : 'option'
                },
                step1, step2
            ;
            
            step1 = userSession.createStep(userId, options, action);
            userSession.addStep(userId, step1);
            step2 = userSession.createStep(userId, options, action);
            userSession.addStep(userId, step2);
            
            sameStep = step1.addParam('foo', 'bar');
            expect(sameStep).to.equal(step1);
            
            expect(step1.getParam('foo')).to.equal('bar');
            step1.clearParam('foo');
            expect(step1.getParam('foo')).to.equal(undefined);
            expect(step1.getParam('stepNumber')).to.equal(1);            
            expect(step1.getParam('previousStep')).to.equal(null);            
            expect(step1.getParam('userId')).to.equal(userId);  
            expect(step1.getOption('some')).to.equal('option');  
            expect(step1.getOptions()).to.equal(options);  
            expect(step1.getAction()).to.equal(action);  
            
            expect(step2.getParam('stepNumber')).to.equal(2);            
            expect(step2.getParam('previousStep')).to.equal(step1); 
            
            expect(step2.hasParam('previousStep')).to.equal(true); 
            expect(step2.hasParam('blahBlahBlah')).to.equal(false); 
            
            expect(step2.getParam('userId')).to.equal(userId);
            expect(step2.getOption('some')).to.equal('option');  
            expect(step2.getOptions()).to.equal(options);  
            expect(step2.getAction()).to.equal(action); 
        });
    });
});
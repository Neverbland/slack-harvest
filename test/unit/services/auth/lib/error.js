'use strict';

var expect                  = require('chai').expect,
    path                    = './../../../../../app/services/auth/lib/',
    authErrorFactory        = require(path + 'error.js');
    
describe('auth/lib/error', function () {
    
    describe('error.create', function () {
        
        var message = "Some message",
            errorReasons = [
                "Some error reason 1", 
                "Some error reason 2"
            ],
            error = authErrorFactory.create(message, errorReasons);
        
        it ("Should create a new AuthError", function () {
            expect(error.name).to.be.equal('AuthError');
        });
        
        it ("Should return proper error message", function () {
            expect(error.getMessage()).to.be.equal(message);
        });
        
        it ("Should return proper error reasons", function () {
            var reasons = error.getErrors();
            expect(reasons).to.be.a('array');
            expect(reasons).to.include.members(errorReasons);
        });
    });
    
});
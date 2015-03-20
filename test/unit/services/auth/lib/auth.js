'use strict';

var expect              = require('chai').expect,
    path                = './../../../../../app/services/auth/lib/',
    authErrorFactory    = require(path + 'error.js'),
    auth                = require(path + 'auth.js');
    
    
    
    
describe('auth/lib/auth', function () {
    
    describe("Auth.hasAccess", function () {
        var requestMock = {
            body : {}
        };
        it("Should be able to register handlers and call them when asked if access is granted.", function () {
            auth.addHandler({
                validate : function (req) {
                    expect(req).to.equal(requestMock);
                }
            });
            expect(auth.handlers.length).to.equal(1);
            auth.hasAccess(requestMock);
        });
        it ("Should return false if registered handler throws an auth error.", function () {
            auth.resetHandlers().addHandler({
                validate : function (req) {
                    throw authErrorFactory.create("Some Error", ["Some Error Reason"]);
                }
            });
            expect(auth.handlers.length).to.equal(1);
            expect(auth.hasAccess(requestMock)).to.equal(false);
        });
        it ("Should return true if registered handler doesn't throw an auth error.", function () {
            auth.resetHandlers().addHandler({
                validate : function (req) {
                    // Do nothing here
                }
            });
            expect(auth.handlers.length).to.equal(1);
            expect(auth.hasAccess(requestMock)).to.equal(true);
        });
        it ("Should throw error if the handler throws any other error than auth error.", function () {
            auth.resetHandlers().addHandler({
                validate : function (req) {
                    throw new Error('Some error');
                }
            });
            expect(auth.handlers.length).to.equal(1);
            expect(auth.hasAccess).to.throw(Error);
        });
    });
});
'use strict';

var expect                  = require('chai').expect,
    path                    = './../../../../../app/services/auth/lib/',
    authErrorFactory        = require(path + 'error.js'),
    auth                    = require(path + 'auth.js'),
    handlersApplier         = require(path + 'handlers.js'),
    crypto                  = require('crypto');
    
    

/**
 * Generates random string of given length
 * 
 * @param       {Number}    len     Integer number of generated string length
 * @returns     {String}            The random string
 */
function generateRandom (len)
{
    var text = "";
    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    for (var i=0; i < len; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    
    return text;
}
    
describe('auth/lib/handlers', function () {
    
    describe("handlers.secret.validate", function () {
        
        it ("Should allow valid requests containing correctly calculated tokens.", function () {
            var action = generateRandom(10),
                seed = generateRandom(10),
                secret = generateRandom(20);
            
            handlersApplier(auth.resetHandlers(), {
                secret : secret
            });
            
            var requestMock = {
                body : {
                    token : (function (input) {
                        var shasum = crypto.createHash('sha1');
                        shasum.update(input, 'utf8');
                        return shasum.digest('hex');
                    })([
                        secret,
                        seed,
                        action
                    ].join('|')),
                    action : action,
                    seed : seed
                }
            };
            
            expect(auth.handlers.length).to.equal(1);
            expect(auth.hasAccess(requestMock)).to.equal(true);
        });
        
        it ("Should ban invalid requests not containing seeds.", function () {
            var action = generateRandom(10),
                seed = generateRandom(10),
                secret = generateRandom(20);
            
            handlersApplier(auth.resetHandlers(), {
                secret : secret
            });
            
            var requestMock = {
                body : {
                    token : (function (input) {
                        var shasum = crypto.createHash('sha1');
                        shasum.update(input, 'utf8');
                        return shasum.digest('hex');
                    })([
                        secret,
                        seed,
                        action
                    ].join('|')),
                    action : action
                }
            };
            
            expect(auth.handlers.length).to.equal(1);
            expect(auth.hasAccess(requestMock)).to.equal(false);
        });
        
        it ("Should ban invalid requests not containing actions.", function () {
            var action = generateRandom(10),
                seed = generateRandom(10),
                secret = generateRandom(20);
            
            handlersApplier(auth.resetHandlers(), {
                secret : secret
            });
            
            var requestMock = {
                body : {
                    token : (function (input) {
                        var shasum = crypto.createHash('sha1');
                        shasum.update(input, 'utf8');
                        return shasum.digest('hex');
                    })([
                        secret,
                        seed,
                        action
                    ].join('|')),
                    seed : seed
                }
            };
            
            expect(auth.handlers.length).to.equal(1);
            expect(auth.hasAccess(requestMock)).to.equal(false);
        });
        
        
        it ("Should ban invalid requests containing incorrectly calculated tokens.", function () {
            var action = generateRandom(10),
                seed = generateRandom(10),
                secret = generateRandom(20);
            
            handlersApplier(auth.resetHandlers(), {
                secret : secret
            });
            
            var requestMock = {
                body : {
                    token : "InvalidToken",
                    action : action,
                    seed : seed
                }
            };
            
            expect(auth.handlers.length).to.equal(1);
            expect(auth.hasAccess(requestMock)).to.equal(false);
        });
        
        
        it ("Should ban invalid requests not containing tokens.", function () {
            var action = generateRandom(10),
                seed = generateRandom(10),
                secret = generateRandom(20);
            
            handlersApplier(auth.resetHandlers(), {
                secret : secret
            });
            
            var requestMock = {
                body : {
                    action : action,
                    seed : seed
                }
            };
            
            expect(auth.handlers.length).to.equal(1);
            expect(auth.hasAccess(requestMock)).to.equal(false);
        });
    });
    
    
    
    describe("handlers.token.validate", function () {
        
        it ("Should allow valid requests containing correct, matching tokens.", function () {
            
            handlersApplier(auth.resetHandlers(), {
                token : 'thisisatoken'
            });
            
            var requestMock = {
                body : {
                    token : 'thisisatoken'
                }
            };
            
            expect(auth.handlers.length).to.equal(1);
            expect(auth.hasAccess(requestMock)).to.equal(true);
        });
        
        it ("Should disallow invalid requests containing incorrect, non-matching tokens.", function () {
            handlersApplier(auth.resetHandlers(), {
                token : 'thisisatoken'
            });
            
            var requestMock = {
                body : {
                    token : 'thisisanon-matchingtoken'
                }
            };
            
            expect(auth.handlers.length).to.equal(1);
            expect(auth.hasAccess(requestMock)).to.equal(false);
        });
    });
});
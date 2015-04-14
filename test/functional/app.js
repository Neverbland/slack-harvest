'use strict';

var app             = require('./../../app.js'),
    expect          = require('chai').expect,
    http            = require('http'),
    codes           = require('./../../app/api/codes.js'),
    request         = require('request'),
    auth            = require('./../../app/services/auth/lib/auth.js'),
    applyHandlers   = require('./../../app/services/auth/lib/handlers.js')
;


describe('Functional: Server response', function () {
    
    var server;
    
    before(function () {
        server = http.createServer(app).listen(3333);
    });
    
    
    describe('Server UNAUTHORIZED error response', function () {

        it('Should show an \'access dennied\' code/message, JSON object as a response body, containing success, code and error reasons.', function (done) {
            request.post({
                url : 'http://localhost:3333/api/timer'
            }, function (err, res, body) {
                
                var json = JSON.parse(body);
                expect(res.statusCode).to.be.equal(codes.UNAUTHORIZED);
                expect(json.code).to.be.equal(codes.UNAUTHORIZED);        
                expect(json.success).to.be.equal(false);    
                expect(json.errors).to.be.a('array');
                expect(json.errors).to.include.members([
                    'Provided token is invalid'
                ]);

                done();
            });

        });
    });
    
    
    describe('Server 404 error response', function () {

        it('Should show a 404 code/message if accessed url does not exist', function (done) {
            applyHandlers(auth, {
                token : 'thisissomeauthtoken'
            });
            
            request.post({
                url : 'http://localhost:3333/api/non-existing-url',
                form : {
                    token : 'thisissomeauthtoken'
                }
            }, function (err, res, body) {

                var json = JSON.parse(body);
                expect(json.success).to.be.equal(false);    
                expect(json.code).to.be.equal(codes.NOT_FOUND);                    
                expect(res.statusCode).to.be.equal(codes.NOT_FOUND);
                done();
            });
        });
    });
    
    
    after(function (done) {
        server.close(done);
    });
});
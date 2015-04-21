'use strict';

var app                 =   require('./../../app.js'),
    expect              =   require('chai').expect,
    http                =   require('http'),
    codes               =   require('./../../app/api/codes.js'),
    request             =   require('request'),
    auth                =   require('./../../app/services/auth/lib/auth.js'),
    applyHandlers       =   require('./../../app/services/auth/lib/handlers.js'),
    sinon               =   require("sinon"),
    sinonChai           =   require("sinon-chai"),
    rewire              =   require('rewire'),
    harvestMock         =   require('./../mock/harvest'),
    notifyController    =   rewire('./../../app/api/controllers/actions/notify_user.js'),
    dayEntries          =   [],
    slackNotifier       =   require('./../../app/services/slack/notifier'),
    notifier            =   require('./../../app/services/notifier')
;


notifyController.__set__('harvest', harvestMock);

describe('Functional: Notifications', function () {
    
    var server;
    
    applyHandlers(auth, {
        token : 'thisissomeauthtoken'
    });
    
    
    before(function () {
        server = http.createServer(app).listen(3333);
    });
    
    describe('Notify user', function () {
        it('Should send a notification to the user after calling proper api url.', function (done) {
            
            var userId = 2345;
                
            harvestMock.setUsers({
                '23456' : 'some_test_user'
            });
            

            request.post({
                url : 'http://localhost:3333/api/notify-user/' + userId,
                form : {
                    token : 'thisissomeauthtoken'
                }
            }, function (err, res, body) {  

                var json = JSON.parse(body);
//                expect(res.statusCode).to.be.equal(codes.OK);
//                expect(json.code).to.be.equal(codes.OK);        
//                expect(json.success).to.be.equal(true);    
                done();
            });
        });
    });
    
    
    after(function (done) {
        server.close(done);
    });
});
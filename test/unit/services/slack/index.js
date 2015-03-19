'use strict';

var expect   = require('chai').expect,
    rewire = require('rewire'),
    config = {
        "username" : "Harvest",
        "icon_url": "https://avatars0.githubusercontent.com/u/43635?v=3&s=200",
        "endpoint" : "XXXXXXXXXXXXXX"
    },
    slackModule = rewire('./../../../../app/services/slack'),
    requestMock = {
        post : function () {

            expect(arguments.length).to.satisfy(function (num) {
                return num === 2;
            });
            
            
            var params = arguments[0],
                callback = arguments[1];
        
            expect(params).to.be.a('object');
            expect(callback).to.be.a('function');
            expect(params.url).to.be.equal(config.endpoint);
            expect(params.form.payload).to.be.a('string');
            var payloadJSON = JSON.parse(params.form.payload);
            expect(payloadJSON).to.be.a('object');
        }
    };
    
slackModule.__set__('request', requestMock);
var slack = slackModule('default', config);


describe('slack', function () {
    describe('slack.sendMessage', function () {
        it('Should send a request for given url with given post data', function () {
            slack.sendMessage("Test", {}, function () {});
        });
    });
});
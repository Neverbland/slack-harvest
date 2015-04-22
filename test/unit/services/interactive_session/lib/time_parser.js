/*jshint node: true*/
'use strict';

var expect          = require('chai').expect,
    timeParser      = require('./../../../../../app/services/interactive_session/lib/time_parser.js'),
    _               = require('lodash')
;


describe('time_parser', function () {
    
    describe('time_parser.getDefaultInstance', function () {
        it('Should return same instance of Parser', function () {
            expect(timeParser.getDefault()).to.equal(timeParser.getDefault());
            expect((timeParser.getDefault()).constructor.name).to.be.equal('Parser');
        });
    });
    
    describe('time_parser.createDefault', function () {
        it('Should not return same instance of Parser', function () {
            expect(timeParser.createDefault()).to.not.equal(timeParser.createDefault());
            expect((timeParser.createDefault()).constructor.name).to.be.equal('Parser');
        });
    });
    
    
    describe('time_parser.error', function () {
        it('Should reference the constructor of TranslatorNotFoundError', function () {
            expect((new timeParser.error()).constructor.name).to.be.equal('TranslatorNotFoundError');
        });
    });
    
    
    describe('Parser.getTranslators', function () {
        it('Should return all registered translators', function () {
            expect(timeParser.getDefault().getTranslators().length).to.be.above(0);
        });
    });
    
    
    describe('Parser.parse', function () {
        it('Should be able to parse the default time format: HH:mm', function () {
            
            var times = [
                {given : '1:00', expected : 1.0},
                {given : '01:00', expected : 1.0},
                {given : '01:30', expected : 1.5},
                {given : '02:15', expected : 2.25}
            ];
            
            _.each(times, function (timeObject) {
                var given = timeObject.given,
                    expected = timeObject.expected
                ;
                
                expect(timeParser.getDefault().parse(given)).to.be.equal(expected);
            });
        });
        
        it ('Should throw TranslatorNotFoundError instance if given time string cannot be parsed', function () {
            var invalidTime = 'this is an invalid time string';
            expect(function () {
                timeParser.getDefault().parse(invalidTime);
            }).to.throw(timeParser.error);
        });
    });
    
});
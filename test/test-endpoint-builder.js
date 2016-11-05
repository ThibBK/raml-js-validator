'use strict';

const assert = require('chai').assert;
const endpointBuilder = require('../lib/endpoint-builder');

const paramMappings = require('../lib/param-mappings');
const sinon = require('sinon');

describe('endpoint-builder', () => {
    describe('buildUnparsedUri()', () => {

        let mockResourceNoBaseuri = {
            absoluteUri: function() {return '/resource'},
            completeRelativeUri: function() {return '/resource'}
        }

        let mockResourceWithBaseuri = {
            absoluteUri: function() {return 'http://baseuri/resource'},
            completeRelativeUri: function() {return '/resource'}
        }

        it('should strip the ending slash on the target', () => {
            assert.equal(
                endpointBuilder.buildUnparsedUri('http://target/', mockResourceNoBaseuri),
                'http://target/resource');
        });

        it('target specified and no baseUri in the resource', () => {
            assert.equal(
                endpointBuilder.buildUnparsedUri('http://target', mockResourceNoBaseuri),
                'http://target/resource');
        });

        it('target specified and baseUri in the resource', () => {
            assert.equal(
                endpointBuilder.buildUnparsedUri('http://target', mockResourceWithBaseuri),
                'http://target/resource');
        });

        it('target not specified and no baseUri in the resource', () => {
            assert.equal(
                endpointBuilder.buildUnparsedUri(undefined, mockResourceNoBaseuri),
                'http://localhost:8080/resource');
        });

        it('target not specified and baseUri in the resource', () => {
            assert.equal(
                endpointBuilder.buildUnparsedUri(undefined, mockResourceWithBaseuri),
                'http://baseuri/resource');
        });
    });

    describe('parseUriWithStringParameters()', () => {

        before(() => {
            sinon.stub(paramMappings, 'get', function() { return 'a'; });
        });

        after(() => {
            paramMappings.get.restore();
        });

        let mockParam = { type: function() {return typeof('string');} }

        it('should return a parsed uri with a param replaced', () => {
            assert.equal(
                endpointBuilder.parseUriWithParameters(
                    'http://target.com/resource/{testParam}', [mockParam]),
                'http://target.com/resource/a');
        });

        it('should return a parsed uri with more than one param replaced', () => {
            assert.equal(
                endpointBuilder.parseUriWithParameters(
                    'http://target.com/resource/{testParam}/{anotherTestParam}', [mockParam, mockParam]),
                'http://target.com/resource/a/a');
        });

    });

    describe('parseUriWithIntParameters()', () => {

        before(() => {
            sinon.stub(paramMappings, 'get', function() { return 1; });
        });

        after(() => {
            paramMappings.get.restore();
        });

        let mockParam = { type: function() {return typeof(1);} }

        it('should return a parsed uri with an integer type param', () => {
            assert.equal(
                endpointBuilder.parseUriWithParameters(
                    'http://target.com/resource/{testParam}/{anotherTestParam}', [mockParam, mockParam]),
                'http://target.com/resource/1/1');
        });

    });
});

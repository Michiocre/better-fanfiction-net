const utils = require('../src/utils');
const expect = require('expect.js');

describe('encode', () => {
    it('should work with empty strings', () => {
        expect(utils.utf8_to_b64('')).to.be('');
    });
    it('should work with test strings', () => {
        expect(utils.utf8_to_b64('This is a test')).to.be('VGhpcyBpcyBhIHRlc3Q=');
    });
});

describe('decode', () => {
    it('should work with empty strings', () => {
        expect(utils.b64_to_utf8('')).to.be('');
    });
    it('should work with test strings', () => {
        expect(utils.b64_to_utf8('VGhpcyBpcyBhIHRlc3Q=')).to.be('This is a test');
    });
});

describe('en/decode', () => {
    it('should work with empty strings', () => {
        expect(utils.b64_to_utf8(utils.utf8_to_b64(''))).to.be('');
    });
    it('should work with test strings', () => {
        expect(utils.b64_to_utf8(utils.utf8_to_b64('This is a test'))).to.be(
            'This is a test',
        );
    });
    it('should work with special characters', () => {
        expect(utils.b64_to_utf8(utils.utf8_to_b64('&'))).to.be('&');
    });
});

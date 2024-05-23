const utils = require('../src/utils');
const expect = require('expect.js');

describe('encode', () => {
    expect(utils.utf8_to_b64('')).to.be('');
    expect(utils.utf8_to_b64('This is a test')).to.be('VGhpcyBpcyBhIHRlc3Q=');
});

describe('decode', () => {
    expect(utils.b64_to_utf8('')).to.be('');
    expect(utils.b64_to_utf8('VGhpcyBpcyBhIHRlc3Q=')).to.be('This is a test');
});

describe('en/decode', () => {
    expect(utils.b64_to_utf8(utils.utf8_to_b64(''))).to.be('');
    expect(utils.b64_to_utf8(utils.utf8_to_b64('This is a test'))).to.be('This is a test');
    expect(utils.b64_to_utf8(utils.utf8_to_b64('&'))).to.be('&');
});
const utils = require('../src/utils');

test('encode', () => {
    expect(utils.utf8_to_b64('')).toBe('');
    expect(utils.utf8_to_b64('This is a test')).toBe('VGhpcyBpcyBhIHRlc3Q=');
});

test('decode', () => {
    expect(utils.b64_to_utf8('')).toBe('');
    expect(utils.b64_to_utf8('VGhpcyBpcyBhIHRlc3Q=')).toBe('This is a test');
});

test('en/decode', () => {
    expect(utils.b64_to_utf8(utils.utf8_to_b64(''))).toBe('');
    expect(utils.b64_to_utf8(utils.utf8_to_b64('This is a test'))).toBe('This is a test');
    expect(utils.b64_to_utf8(utils.utf8_to_b64('&'))).toBe('&');
});
const fs = require('fs');
const path = require("path");
let loggingPath = path.join('logs','default.txt');

function initLogging() {    
    if (!fs.existsSync(loggingPath)) {
        fs.mkdirSync(path.dirname(loggingPath), {recursive: true});
    }
    fs.appendFileSync(loggingPath, '\n')
}

function log(...args) {
    console.log(...args);
    write(...args);
}

function info(...args) {
    console.info(...args);
    write(...args);
}

function warn(...args) {
    console.warn(...args);
    write(...args);
}

function error(...args) {
    console.error(...args);
    write(...args);
}

function write(...args) {
    let message = `[${new Date().toUTCString()}]`;
    for (let arg of args) {
        if (arg?.toString() == '[object Object]') {
            arg = JSON.stringify(arg);
        }
        message += ` ${arg}`;
    }

    message += '\n';
    fs.appendFileSync(loggingPath, message);
}

function utf8_to_b64( str ) {
    return btoa(unescape(encodeURIComponent( str )));
}

function b64_to_utf8( str ) {
    return decodeURIComponent(escape(atob( str )));
}

module.exports = {
    initLogging,
    log,
    info,
    warn,
    error,
    utf8_to_b64,
    b64_to_utf8
}
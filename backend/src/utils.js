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
    write(args);
}

function info(...args) {
    console.info(...args);
    write(args);
}

function warn(...args) {
    console.warn(...args);
    write(args);
}

function error(...args) {
    console.error(...args);
    write(args);
}

function write(...args) {
    fs.appendFileSync(loggingPath, `[${new Date().toUTCString()}]`);
    for (let arg of args) {
        if (arg.toString() == '[object Object]') {
            arg = JSON.stringify(arg);
        }
        fs.appendFileSync(loggingPath, ' ' + arg);
    }
    fs.appendFileSync(loggingPath, '\n');
}

module.exports = {
    initLogging,
    log,
    info,
    warn,
    error
}
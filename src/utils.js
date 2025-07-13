const fs = require('node:fs');
const path = require('node:path');
//let loggingPath = path.join('logs',new Date().toJSON().slice(0,19).replaceAll(':', '-') + '.txt');
const loggingPath = path.join('logs', 'log.txt');

function initLogging() {
    if (!fs.existsSync(loggingPath)) {
        fs.mkdirSync(path.dirname(loggingPath), { recursive: true });
        fs.writeFileSync(loggingPath, '');
    }
}

function log(...args) {
    console.log(...args);
    write('log', ...args);
}

function info(...args) {
    console.info(...args);
    write('info', ...args);
}

function warn(...args) {
    console.warn(...args);
    write('warn', ...args);
}

function error(...args) {
    console.error(...args);
    write('error', ...args);
}

function write(type, ...args) {
    let message = `[${new Date().toUTCString()}] [${type}]`;
    for (let arg of args) {
        if (arg?.toString() === '[object Object]') {
            arg = JSON.stringify(arg);
        }
        message += ` ${arg}`;
    }

    message += '\n';
    fs.appendFileSync(loggingPath, message);
}

function utf8_to_b64(str) {
    return btoa(unescape(encodeURIComponent(str)));
}

function b64_to_utf8(str) {
    return decodeURIComponent(escape(atob(str)));
}

/**
 * @param {number} val
 * @param {number} min
 * @param {number} max
 * @returns {number}
 */
function clamp(val, min, max) {
    if (val > max) {
        return max;
    }
    if (val < min) {
        return min;
    }
    return val;
}

/**
 * @param {string} date
 * @returns {number}
 */
function dateStringToUnix(date) {
    return Math.floor(new Date(date).getTime() / 1000);
}

module.exports = {
    initLogging,
    log,
    info,
    warn,
    error,
    utf8_to_b64,
    b64_to_utf8,
    clamp,
    dateStringToUnix,
};

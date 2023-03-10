const fs = require('fs');
const path = require("path");

function initLogging() {
    let loggingPath = path.join('logs','default.txt');
    
    if (!fs.existsSync(loggingPath)) {
        fs.mkdirSync(path.dirname(loggingPath), {recursive: true});
    }
    fs.appendFileSync(loggingPath, '\n')

    console.logCopy = console.log.bind(console);
    console.infoCopy = console.info.bind(console);
    console.warnCopy = console.warn.bind(console);
    console.errorCopy = console.error.bind(console);

    console.log = function(...args) {
        let newData = `[${new Date().toUTCString()}] ${args.join(' ')}`;
        this.logCopy(newData);
        fs.appendFileSync(loggingPath, newData + '\n');
    };
    console.info = function(...args) {
        let newData = `[${new Date().toUTCString()}] ${args.join(' ')}`;
        this.infoCopy(newData);
        fs.appendFileSync(loggingPath, newData + '\n');
    };
    console.warn = function(...args) {
        let newData = `[${new Date().toUTCString()}] ${args.join(' ')}`;
        this.warnCopy(newData);
        fs.appendFileSync(loggingPath, newData + '\n');
    };
    // console.error = function(...args) {
    //     let newData = `[${new Date().toUTCString()}] ${args.join(' ')}`;
    //     this.errorCopy(newData);
    //     fs.appendFileSync(loggingPath, newData + '\n');
    // };
}

module.exports = {
    initLogging 
}
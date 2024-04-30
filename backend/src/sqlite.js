const sqlite3 = require("better-sqlite3");
const utils = require('./utils');
const path = require('path');

let db;

async function init(filename) {
    try {
        let dbPath = path.resolve(__dirname, '../..', filename);
        console.log(dbPath);
        db = sqlite3(dbPath);
    } catch (error) {
        utils.log('Database file could not be found');
        throw error;
    }
}

async function saveFandoms(fandoms) {
    if (!db) {
        throw Error('Database connection has not been established')  
    }
    try {
        const insert = db.prepare('INSERT OR IGNORE INTO fandom (id, name, category) VALUES(?, ?, ?)');

        const insertMany = db.transaction((fandoms) => {
            for (const fandom of fandoms) {
                fandom.name = fandom.name.replace(/\s{2,}/, ' ');
                insert.run([fandom.id, fandom.name, fandom.category]);
            }
        });

        insertMany(fandoms);
    } catch (error) {
        utils.warn(error);
        return -1;
    }

    return 0;
}

async function saveStories() {
    console.log('TODO');
}

async function getFandoms() {
    if (!db) {
        throw Error('Database connection has not been established')  
    }
    
    const stmt = db.prepare('SELECT * FROM `fandom`');
    return stmt.all()
}

async function getFandomCount() {
    if (!db) {
        throw Error('Database connection has not been established')  
    }
    
    const stmt = db.prepare('SELECT COUNT(*) as count FROM `fandom`');
    return stmt.get()
}

async function getFandomsByCategory() {
    console.log('TODO');
}

async function getStoryById(id) {
    if (!db) {
        throw Error('Database connection has not been established')  
    }
    
    const stmt = db.prepare('SELECT * FROM `story` WHERE `id` = ?');
    return stmt.get(id);
}

async function getCommunitiesByStoryId() {
    console.log('TODO');
}


module.exports = {
    init,
    saveFandoms,
    saveStories,
    getFandoms,
    getFandomsByCategory,
    getStoryById,
    getCommunitiesByStoryId,
    getFandomCount
}
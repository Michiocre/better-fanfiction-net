const sqlite3 = require("better-sqlite3");
const utils = require('./utils');
const path = require('path');
const fs = require('fs');

let db;

 function init(filename) {
    try {
        let dbPath = path.resolve(__dirname, '../..', filename);
        db = sqlite3(dbPath);
    } catch (error) {
        utils.log('Database file could not be found');
        throw error;
    }
    db.exec(fs.readFileSync(path.resolve(__dirname, '../../db/sqlite/setup.sql')).toString());
    db.pragma('foreign_keys = ON');
}

 function saveFandoms(fandoms) {
    if (!db) {
        throw Error('Database connection has not been established')  
    }
    try {
        const insert = db.prepare('INSERT OR IGNORE INTO fandom (id, name, category) VALUES(?, ?, ?)');

        const insertMany = db.transaction((fandoms) => {
            for (const fandom of fandoms) {
                fandom.name = fandom.name.replace(/\s{2,}/, ' ');
                insert.run(fandom.id, fandom.name, fandom.category);
            }
        });

        insertMany(fandoms);
    } catch (error) {
        utils.warn(error);
        return -1;
    }

    return 0;
}

 function saveAuthors(authors) {
    if (!db) {
        throw Error('Database connection has not been established')  
    }
    
    try {
        const insert = db.prepare('INSERT OR REPLACE INTO author (id, name) VALUES(?, ?)');

        const insertMany = db.transaction((authors) => {
            for (const author of authors) {
                insert.run(author.id, author.name);
            }
        });

        insertMany(authors);
    } catch (error) {
        utils.warn(error);
        return -1;
    }

    return 0;
};

 function saveCommunity(community) {
    if (!db) {
        throw Error('Database connection has not been established')  
    }

    let fandom;
    if (typeof community.fandom == 'number') {
        fandom = {id: community.fandom};
    } else {
        fandom =  getFandomByName(community.fandom);
    }

    if (!fandom) {
        utils.warn('Could not find fandom, maybe try running getFandoms again', community.fandom);
        return;
    }

    try {
         saveAuthors([community.author, ...community.staff]);

        const insertMany = db.transaction((community) => {
            const stmt = db.prepare('INSERT OR REPLACE INTO community (id, name, founder_id, focus_id, start_date, story_count, followers, description) VALUES(?, ?, ?, ?, ?, ?, ?, ?)');
            stmt.run(community.id, community.name, community.author.id, fandom.id, community.start_date, community.story_count, community.follower, community.description);
            
            const delStmt = db.prepare('DELETE FROM community_author WHERE community_id =  ?');
            delStmt.run(community.id);
            
            const insert = db.prepare('INSERT OR IGNORE INTO community_author (community_id, author_id) Values(?, ?)');
            for (const author of [community.author, ...community.staff]) {
                insert.run(community.id, author.id);
            }
        });

        insertMany(community);
    } catch (error) {
        utils.warn(error);
        return -1;
    }

    return 0;
}

 function saveCharacters(characters, pairings, fandomId, xfandomId = null) {
    if (!db) {
        throw Error('Database connection has not been established')  
    }

    let chars = new Set(characters);
    if (pairings) {
        for (let pair of pairings) {
            chars.add(pair[0]);
            chars.add(pair[1]);
        }
    }

    try {
        const insert = db.prepare('INSERT OR IGNORE INTO character (name, fandom_id) VALUES(?, ?)');
        const insertMany = db.transaction((chars, fandomId, xfandomId) => {
            for (const char of chars) {
                insert.run(char, fandomId);
                if (xfandomId) {
                    insert.run(char, xfandomId);
                }
            }
        });

        insertMany(chars, fandomId, xfandomId);
    } catch (error) {
        utils.warn(error);
        return -1;
    }

    return 0;
};

 function saveStories(stories) {
    if (!db) {
        throw Error('Database connection has not been established')  
    }

    let authors = stories.map(story => story.author);
    authors = [
        ...new Map(authors.map(obj => [obj.id, obj]))
        .values()
    ];
     saveAuthors(authors);

    let community = stories[0].community;
    if (community) {
         saveCommunity(community);
    }

    let saved = [];

    
    const storyTransaction = db.transaction( (story) => {
        try {
            let fandom; 
            if (typeof story.fandom == 'number') {
                fandom = {id: story.fandom};
            } else {
                fandom = getFandomByName(story.fandom, story.xfandom);
            }

            let xfandom; 
            if (typeof story.xfandom == 'number') {
                xfandom = {id: story.xfandom};
            } else {
                xfandom = getFandomByName(story.xfandom);
            }

            if (!fandom) {
                utils.warn('Could not find fandom, maybe try running getFandoms again: ', {name: story.fandom});
                return;
            }
            if (story.xfandom && !xfandom) {
                utils.warn('Could not find xfandom, maybe try running getFandoms again: ', {name: story.xfandom});
                return;
            }

             saveCharacters(story.characters, story.pairings, fandom.id, xfandom?.id);

            const insert = db.prepare('INSERT OR REPLACE INTO story (id, title, author_id, fandom_id, xfandom_id, description, rating, chapters, words, reviews, favs, follows, updated, published, completed, genreA, genreB) VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
            insert.run(story.id, story.title, story.author.id, fandom.id, xfandom?.id, story.description, story.rated, story.chapters, story.words, story.reviews, story.favs, story.follows, story.updated, story.published, story, story.completed?1:0, story.genreA, story.genreB);

            let characters = [];
            for (let char of story.characters) {
                let loadedChar =  getCharacterByNameAndFandom(char, fandom.id);
                if (loadedChar) {
                    characters.push([loadedChar.id, 0]);
                }
                if (xfandom) {
                    let loadedChar =  getCharacterByNameAndFandom(char, xfandom.id);
                    if (loadedChar) {
                        characters.push([loadedChar.id, 0]);
                    }
                }
            }
            for (let i = 1; i < story.pairings.length; i++) {
                let pairCharacter = [];
                for (let char of story.pairings[i]) {
                    let loadedChar =  getCharacterByNameAndFandom(char, fandom.id);
                if (loadedChar) {
                    characters.push([loadedChar.id, i]);
                }
                if (xfandom) {
                    let loadedChar =  getCharacterByNameAndFandom(char, xfandom.id);
                    if (loadedChar) {
                        characters.push([loadedChar.id, i]);
                    }
                }
                }
                characters = characters.concat(pairCharacter);
            }

            characters = [
                ...new Map(characters.map(obj => [obj[0], obj]))
                .values()
            ];

            const insertChars = db.prepare('INSERT OR REPLACE INTO story_character (story_id, character_id, pairing) VALUES (?, ?, ?)');
            const insertManyChars = db.transaction((characters) => {
                for (const char of characters) {
                    insertChars.run(story.id, char[0], char[1]);
                }
            });

            insertManyChars(characters);

            if (community) {
                const insertCommunity = db.prepare('INSERT OR REPLACE INTO story_community (story_id, community_id) VALUES (?, ?)');

                insertCommunity.run(story.id, community.id);
            }

            saved.push(story);
        } catch (error) {
            utils.warn(error);
        }
    });

    for (const story of stories) {
        try {
             storyTransaction(story);
        } catch (error) {
            continue;
        }
    }
    return saved;
}

 function getFandoms() {
    if (!db) {
        throw Error('Database connection has not been established')  
    }
    
    const stmt = db.prepare('SELECT * FROM `fandom`');
    return stmt.all()
}

 function getFandomCount() {
    if (!db) {
        throw Error('Database connection has not been established')  
    }
    
    const stmt = db.prepare('SELECT COUNT(*) as count FROM `fandom`');
    return stmt.get()
}

 function getFandomsByCategory(category) {
    if (!db) {
        throw Error('Database connection has not been established')  
    }

    const stmt = db.prepare('SELECT * FROM `fandom` WHERE `category` = ?');
    return stmt.get(category);
}

 function getStoryById(id) {
    if (!db) {
        throw Error('Database connection has not been established')  
    }
    
    const stmt = db.prepare('SELECT * FROM `story` WHERE `id` = ?');
    return stmt.get(id);
}

 function getCommunitiesByStoryId(storyId) {
    if (!db) {
        throw Error('Database connection has not been established')  
    }
    
    const stmt = db.prepare('SELECT * FROM story_community sc INNER JOIN community c ON sc.community_id = c.id WHERE sc.story_id = ?');
    return stmt.all(storyId);
}

 function getFandomByName(name, backUpName = null) {
    if (!db) {
        throw Error('Database connection has not been established')  
    }

    if (!name) {
        return null;
    }

    let name2 = name.replaceAll('&amp;', '&')
        .replaceAll('&lt;', '<')
        .replaceAll('&gt;', '>')
        .replaceAll('\'', '\\\'');
    let name3 = '';
    let name4 = '';

    if (backUpName) {
        backUpName = backUpName.replaceAll('&amp;', '&')
            .replaceAll('&lt;', '<')
            .replaceAll('&gt;', '>')
            .replaceAll('\'', '\\\'');


        if (backUpName.includes(' & ')) {
            name3 = name2 + ' & ' + backUpName.split(' & ')[0];
        }
    } else {
        if (name2.includes(' & ')) {
            let parts = name2.split(' & ');
            parts.shift();
    
            name4 = parts.join(' & ');
        }
    }

    const stmt = db.prepare('SELECT * FROM fandom WHERE name IN (?, ?, ?, ?)');
    return stmt.get(name, name2, name3, name4);
}

 function getCharacterByNameAndFandom(name, fandom_id) {
    if (!db) {
        throw Error('Database connection has not been established')  
    }

    const stmt = db.prepare('SELECT * FROM character WHERE name = ? AND fandom_id = ?');
    return stmt.get([name, fandom_id]);
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
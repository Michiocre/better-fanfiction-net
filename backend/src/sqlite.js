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

async function saveAuthors(authors) {
    if (!db) {
        throw Error('Database connection has not been established')  
    }
    
    try {
        const insert = db.prepare('INSERT OR REPLACE INTO author (id, name) VALUES(?, ?)');

        const insertMany = db.transaction((authors) => {
            for (const author of authors) {
                insert.run([author.id, author.name]);
            }
        });

        insertMany(authors);
    } catch (error) {
        utils.warn(error);
        return -1;
    }

    return 0;
};

async function saveCommunity(community) {
    if (!db) {
        throw Error('Database connection has not been established')  
    }

    let fandom;
    if (typeof community.fandom == 'number') {
        fandom = {id: community.fandom};
    } else {
        fandom = await getFandomByName(community.fandom);
    }

    if (!fandom) {
        utils.warn('Could not find fandom, maybe try running getFandoms again', community.fandom);
        return;
    }

    try {
        await saveAuthors([community.author, ...community.staff]);

        const insertMany = db.transaction((community) => {
            const stmt = db.prepare('INSERT OR REPLACE INTO community (id, name, founder_id, focus_id, start_date, story_count, followers, description) VALUES(?, ?, ?, ?, ?, ?, ?, ?)');
            stmt.run([community.id, community.name, community.author.id, fandom.id, community.start_date, community.story_count, community.follower, community.description]);
            
            const delStmt = db.prepare('DELETE FROM community_author WHERE community_id =  ?');
            delStmt.run(community.id);
            
            const insert = db.prepare('INSERT OR IGNORE INTO community_author (community_id, author_id) Values(?, ?)');
            for (const author of [community.author, ...community.staff]) {
                insert.run([community.id, author.id]);
            }
        });

        insertMany(community);
    } catch (error) {
        utils.warn(error);
        return -1;
    }

    return 0;
}

async function saveCharacters(characters, pairings, fandomId, xfandomId = null) {
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
        const insert = db.prepare('INSERT IGNORE INTO character (name, fandom) VALUES(?, ?)');
        const insertMany = db.transaction((chars, fandomId, xfandomId) => {
            for (const char of chars) {
                insert.run([char, fandomId]);
                if (xfandomId) {
                    insert.run([char, xfandomId]);
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

async function saveStories(stories) {
    if (!db) {
        throw Error('Database connection has not been established')  
    }

    let authors = stories.map(story => story.author);
    authors = [
        ...new Map(authors.map(obj => [obj.id, obj]))
        .values()
    ];
    await saveAuthors(authors);

    let community = stories[0].community;
    if (community) {
        await saveCommunity(community);
    }

    let saved = [];

    for (let story of stories) {
        let fandom; 
        if (typeof story.fandom == 'number') {
            fandom = {id: story.fandom};
        } else {
            fandom = await getFandomByName(story.fandom);
        }

        let xfandom; 
        if (typeof story.xfandom == 'number') {
            xfandom = {id: story.xfandom};
        } else {
            xfandom = await getFandomByName(story.xfandom);
        }

        if (!fandom) {
            utils.warn('Could not find fandom, maybe try running getFandoms again', story.fandom);
            continue;
        }
        if (story.xfandom && !xfandom) {
            utils.warn('Could not find xfandom, maybe try running getFandoms again', story.xfandom);
            continue;
        }
        await saveCharacters(story.characters, story.pairings, fandom.id, xfandom?.id);
    

        try {
            const insert = db.prepare('INSERT OR REPLACE INTO story (id, title, author_id, fandom_id, xfandom_id, description, rating, chapters, words, reviews, favs, follows, updated, published, genreA, genreB) VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
            const insertMany = db.transaction((stories) => {
                for (const story of stories) {
                    insert.run([story.id, story.title, story.author.id, fandom.id, xfandom?.id, story.description, story.rated, story.chapters, story.words, story.reviews, story.favs, story.follows, story.updated, story.published, story.completed, story.genreA, story.genreB]);

                }
            });
    
            insertMany(stories);
        } catch (error) {
            utils.warn(error);
            return -1;
        }

        //TODO CHANGE FROM HERE

            //Add story_character connection
            let characters = [];
            for (let char of story.characters) {
                let loadedChar = await getCharacterByNameAndFandom(char, fandom.id);
                if (loadedChar) {
                    characters.push([loadedChar.id, 0]);
                }
                if (xfandom) {
                    let loadedChar = await getCharacterByNameAndFandom(char, xfandom.id);
                    if (loadedChar) {
                        characters.push([loadedChar.id, 0]);
                    }
                }
            }
            for (let i = 1; i < story.pairings.length; i++) {
                let pairCharacter = [];
                for (let char of story.pairings[i]) {
                    let loadedChar = await getCharacterByNameAndFandom(char, fandom.id);
                if (loadedChar) {
                    characters.push([loadedChar.id, i]);
                }
                if (xfandom) {
                    let loadedChar = await getCharacterByNameAndFandom(char, xfandom.id);
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

            let [rows, fields] = await connection.execute('SELECT * FROM `story_character` WHERE story_id = ?', [story.id]);
            let existCharIds = rows.map(row => row.character_id);

            let newConnections = characters.filter(char => !existCharIds.includes(char[0]));
            if (newConnections.length > 0) {
                await connection.query(
                    'INSERT INTO `story_character` VALUES ?',
                    [newConnections.map(char => ([story.id, char[0], char[1]]))]
                );
            }

            if (community) {
                //Add story_community connection
                [rows, fields] = await connection.execute('SELECT * FROM `story_community` WHERE story_id = ? AND community_id = ?', [story.id, community.id]);
                let connectionExists = rows.length >= 1;
    
                if (!connectionExists) {
                    await connection.query(
                        'INSERT INTO `story_community` VALUES (?)',
                        [[story.id, community.id]]
                    );
                }
            }

            await connection.commit()
            saved.push(story);
        } catch (error) {
            utils.warn(error);
            await connection.rollback()
        }
    }

    return saved;

    console.log('TODO');
    //UNTIL HERE
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

async function getFandomsByCategory(category) {
    if (!db) {
        throw Error('Database connection has not been established')  
    }

    const stmt = db.prepare('SELECT * FROM `fandom` WHERE `category` = ?');
    return stmt.get(category);
}

async function getStoryById(id) {
    if (!db) {
        throw Error('Database connection has not been established')  
    }
    
    const stmt = db.prepare('SELECT * FROM `story` WHERE `id` = ?');
    return stmt.get(id);
}

async function getCommunitiesByStoryId(storyId) {
    if (!db) {
        throw Error('Database connection has not been established')  
    }
    
    const stmt = db.prepare('SELECT * FROM story_community sc INNER JOIN community c ON sc.community_id = c.id WHERE sc.story_id = ?');
    return stmt.get(storyId);
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
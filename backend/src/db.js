const mysql = require("mysql2/promise");

const utils = require('./utils');

let connection;

async function init(options) {
    try {
        connection = await mysql.createConnection(options);        
    } catch (error) {
        utils.log('Database connection could not be established');
        throw error;
    }
}

async function getFandomByName(name) {
    if (!connection) {
        throw Error('Database connection has not been established')  
    }

    let [rows, fields] = await connection.execute('SELECT * FROM `fandom` WHERE `name` = ? OR `display` = ?', [name, name]);

    if (rows.length < 1) {
        return null;
    }

    return rows[0];
}

async function getCharacterByNameAndFandom(name, fandom_id) {
    if (!connection) {
        throw Error('Database connection has not been established')  
    }

    let [rows, fields] = await connection.execute('SELECT * FROM `character` WHERE `name` = ? AND `fandom_id` = ?', [name, fandom_id]);

    if (rows.length < 1) {
        return null;
    }

    return rows[0];
}

async function saveFandoms(category, fandoms) {
    if (!connection) {
        throw Error('Database connection has not been established')  
    }

    let [rows, fields] = await connection.execute('SELECT * FROM `fandom`');
    let existingIds = rows.map(row => row.id);

    let newFandoms = fandoms.filter(f => !existingIds.includes(f.id));

    if (newFandoms.length > 0) {
        try {
            await connection.beginTransaction();
            await connection.query(
                'INSERT INTO `fandom` VALUES ?',
                [newFandoms.map(fandom => [fandom.id, fandom.name, category, fandom.display])]
            );
            await connection.commit()
        } catch (error) {
            utils.warn(error);
            await connection.rollback()
        }        
    }
}

async function saveAuthors(authors) {
    if (!connection) {
        throw Error('Database connection has not been established')  
    }

    let [rows, fields] = await connection.execute('SELECT * FROM `author`');
    let existingIds = rows.map(row => row.id);

    try {
        await connection.beginTransaction();
        let newAuthors = new Map();
        for (let author of authors) {
            if (!existingIds.includes(author.id)) {
                newAuthors.set(author.id, author.name);
            }
        }
        newAuthors = Array.from(newAuthors);

        if (newAuthors.length > 0) {
            await connection.query(
                'INSERT INTO `author` VALUES ?',
                [newAuthors]
            );
        }
        await connection.commit()
    } catch (error) {
        utils.warn(error);
        await connection.rollback()
    }    
};

async function saveCharacters(characters, pairings, fandomId) {
    if (!connection) {
        throw Error('Database connection has not been established')  
    }    

    let chars = characters;
    for (let pair of pairings) {
        chars = chars.concat(pair);
    }

    chars = Array.from(new Set(chars));

    let [rows, fields] = await connection.execute('SELECT * FROM `character` WHERE fandom_id = ?', [fandomId]);
    let existingChars = rows.map(row => row.name);

    try {
        await connection.beginTransaction();
        let newChars = chars.filter(char => !existingChars.includes(char)).map(char => {
            return [char, fandomId];
        });

        if (newChars.length > 0) {
            await connection.query(
                'INSERT INTO `character` (name, fandom_id) VALUES ?',
                [newChars]
            );
        }
        await connection.commit()
    } catch (error) {
        utils.warn(error);
        await connection.rollback()
    }    
};

async function saveStories(stories) {
    if (!connection) {
        throw Error('Database connection has not been established')  
    }

    let authors = stories.map(story => story.author);
    await saveAuthors(authors);

    let [rows, fields] = await connection.execute('SELECT * FROM `story`');
    let existingIds = rows.map(row => row.id);

    for (let story of stories) {
        let fandom = await getFandomByName(story.fandom);
        if (!fandom) {
            console.warn('Could not find fandom, maybe try running getFandoms again');
            continue;
        }
        await saveCharacters(story.characters, story.pairings, fandom.id);
    
        try {
            await connection.beginTransaction();
            if (!existingIds.includes(story.id)) {
                //Insert new story
                await connection.query(
                    'INSERT INTO `story` VALUES (?)',
                    [[story.id, story.title, story.author.id, fandom.id, story.description, story.rated, story.chapters, story.words, story.reviews, story.favs, story.follows, story.updated, story.published, story.completed]]
                );
            } else {
                //Update existing story
                await connection.query(
                    'UPDATE `story` SET title=?, author_id=?, fandom_id=?, description=?, rating=?, chapters=?, words=?, reviews=?, favs=?, follows=?, updated=?, published=?, completed=? WHERE id=?',
                    [story.title, story.author.id, fandom.id, story.description, story.rated, story.chapters, story.words, story.reviews, story.favs, story.follows, story.updated, story.published, story.completed, story.id]
                );
            }

            let characters = [];
            for (let char of story.characters) {
                characters.push([(await getCharacterByNameAndFandom(char, fandom.id)).id, null]);
            }
            for (let i = 0; i < story.pairings.length; i++) {
                let pairCharacter = [];
                for (let char of story.pairings[i]) {
                    characters.push([(await getCharacterByNameAndFandom(char, fandom.id)).id, i]);
                }
                characters = characters.concat(pairCharacter);
            }

            let [rows, fields] = await connection.execute('SELECT * FROM `story_character` WHERE story_id = ?', [story.id]);
            let existCharIds = rows.map(row => row.character_id);

            let newConnections = characters.filter(char => !existCharIds.includes(char[0]));
            if (newConnections.length > 0) {
                await connection.query(
                    'INSERT INTO `story_character` VALUES ?',
                    [newConnections.map(char => ([story.id, char[0], char[1]]))]
                );
            }

            await connection.commit()
        } catch (error) {
            utils.warn(error);
            await connection.rollback()
        }
    }
}

async function getFandoms() {
    if (!connection) {
        throw Error('Database connection has not been established')  
    }

    let [rows, fields] = await connection.execute('SELECT * FROM `fandom`');

    return rows;
}

async function getStoryById(id) {
    if (!connection) {
        throw Error('Database connection has not been established')  
    }

    let [rows, fields] = await connection.execute('SELECT * FROM `story` WHERE `id` = ?', [id]);

    if (rows.length < 1) {
        return null;
    }

    return rows[0];
}

module.exports = {
    init,
    saveFandoms,
    saveStories,
    getFandoms,
    getStoryById
}
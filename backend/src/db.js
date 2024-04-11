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

    if (!name) {
        return;
    }

    name = name.replace('&amp;', '&');
    name = name.replace('&lt;', '<');
    name = name.replace('&gt;', '>');
    name = name.replace('\'', '\\\'');

    let [rows, fields] = await connection.execute('SELECT * FROM `fandom` WHERE `name` = ?', [name]);

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

async function saveFandoms(fandoms) {
    if (!connection) {
        throw Error('Database connection has not been established')  
    }
    
    try {
        await connection.beginTransaction();
        for (const fandom of fandoms) {

            fandom.name = fandom.name.replace(/\s{2,}/, ' ');

            await connection.query(
                'CALL `saveFandom`(?, ?, ?)',
                [fandom.id, fandom.name , fandom.category]
            );
        }
        await connection.commit()
    } catch (error) {
        utils.warn(error);
        await connection.rollback();
        return -1;
    }

    return 0;
}

async function saveAuthors(authors) {
    if (!connection) {
        throw Error('Database connection has not been established')  
    }
    
    try {
        await connection.beginTransaction();
        for (const author of authors) {
            await connection.query(
                'CALL `saveAuthor`(?, ?)',
                [author.id, author.name]
            );
        }
        await connection.commit()
    } catch (error) {
        utils.warn(error);
        await connection.rollback();
        return -1;
    }

    return 0;
};

async function saveCharacters(characters, pairings, fandomId, xfandomId = null) {
    if (!connection) {
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
        await connection.beginTransaction();
        for (const char of chars) {
            await connection.query(
                'CALL `saveCharacter`(?, ?, ?)',
                [char, fandomId, xfandomId]
            );
        }
        await connection.commit()
    } catch (error) {
        utils.warn(error);
        await connection.rollback();
        return -1;
    }

    return 0;
};

async function saveCommunity(community) {
    if (!connection) {
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
        await connection.beginTransaction();

        await saveAuthors([community.author, ...community.staff]);

        await connection.query(
            'CALL `saveCommunity`(?, ?, ?, ?, ?, ?, ?, ?)',
            [community.id, community.name, community.author.id, fandom.id, community.start_date, community.story_count, community.follower, community.description]
        );

        let staff = [community.author, ...community.staff];
        
        for (const author of staff) {
            await connection.query(
                'CALL `saveCommunityAuthor`(?, ?)',
                [community.id, staff.id]
            );
        }

        await connection.commit()
    } catch (error) {
        await connection.rollback()
        throw error;
    }
}

async function saveStories(stories) {
    if (!connection) {
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

    let [rows, fields] = await connection.execute('SELECT * FROM `story`');
    let existingIds = rows.map(row => row.id);

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
            await connection.beginTransaction();
            if (!existingIds.includes(story.id)) {
                //Insert new story
                await connection.query(
                    'INSERT INTO `story` VALUES (?)',
                    [[story.id, story.title, story.author.id, fandom.id, xfandom?.id, story.description, story.rated, story.chapters, story.words, story.reviews, story.favs, story.follows, story.updated, story.published, story.completed, story.genreA, story.genreB]]
                );
            } else {
                //Update existing story
                await connection.query(
                    'UPDATE `story` SET title=?, author_id=?, fandom_id=?, xfandom_id=?, description=?, rating=?, chapters=?, words=?, reviews=?, favs=?, follows=?, updated=?, published=?, completed=?, genreA=?, genreB=? WHERE id=?',
                    [story.title, story.author.id, fandom.id, xfandom?.id, story.description, story.rated, story.chapters, story.words, story.reviews, story.favs, story.follows, story.updated, story.published, story.completed, story.genreA, story.genreB, story.id]
                );
            }

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
}

async function getFandoms() {
    if (!connection) {
        throw Error('Database connection has not been established')  
    }

    let [rows, fields] = await connection.execute('SELECT * FROM `fandom`');

    return rows;
}

async function getFandomCount() {
    if (!connection) {
        throw Error('Database connection has not been established')  
    }

    let [rows, fields] = await connection.execute('SELECT COUNT(*) as count FROM `fandom`');

    return rows[0];
}

async function getFandomsByCategory(category) {
    if (!connection) {
        throw Error('Database connection has not been established')  
    }

    let [rows, fields] = await connection.execute('SELECT * FROM `fandom` WHERE `category` = ?', [category]);

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

async function getCommunitiesByStoryId(storyId) {
    if (!connection) {
        throw Error('Database connection has not been established')  
    }

    let [rows, fields] = await connection.execute('SELECT * FROM betterff.story_community sc INNER JOIN betterff.community c ON sc.community_id = c.id WHERE sc.story_id = ?', [storyId]);
    
    return rows;
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
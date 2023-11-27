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
    name = name.replace(`'`, `\\'`);

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

async function saveCommunity(community) {
    if (!connection) {
        throw Error('Database connection has not been established')  
    }

    let [rows, fields] = await connection.query('SELECT * FROM `community` WHERE id = ?', community.id);
    let communityExists = rows.length >= 1;

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
        if (!communityExists) {
            //Insert new community
            await connection.query(
                'INSERT INTO `community` VALUES (?)',
                [[community.id, community.author.id, fandom.id, community.start_date, community.story_count, community.follower, community.description]]
            );
        } else {
            //Update existing community
            await connection.query(
                'UPDATE `community` SET founder_id=?, focus_id=?, start_date=?, story_count=?, followers=?, description=? WHERE id=?',
                [community.author.id, fandom.id, community.start_date, community.story_count, community.follower, community.description, community.id]
            );
        }

        let [rows, fields] = await connection.execute('SELECT * FROM `community_author` WHERE community_id = ?', [community.id]);
        let existingStaffIds = rows.map(row => row.author_id);

        let newStaff = community.staff.filter(staff => !existingStaffIds.includes(staff.id));
        if (newStaff.length > 0) {
            await connection.query(
                'INSERT INTO `community_author` VALUES ?',
                [newStaff.map(staff => ([community.id, staff.id]))]
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

    let authors = new Set(stories.map(story => story.author));

    let community = stories[0].community;
    if (community) {
        authors.add(community.author);
        for (const staff of community.staff) {
            authors.add(staff);
        }
    }

    await saveAuthors(Array.from(authors));

    await saveCommunity(community);

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
            utils.warn('Could not find fandom, maybe try running getFandoms again', story.xfandom);
            continue;
        }
        await saveCharacters(story.characters, story.pairings, fandom.id);
    
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

            //Add story_community connection
            [rows, fields] = await connection.execute('SELECT * FROM `story_community` WHERE story_id = ? AND community_id = ?', [story.id, community.id]);
            let connectionExists = rows.length >= 1;

            if (!connectionExists) {
                await connection.query(
                    'INSERT INTO `story_community` VALUES (?)',
                    [[story.id, community.id]]
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
    getStoryById,
    getCommunitiesByStoryId
}
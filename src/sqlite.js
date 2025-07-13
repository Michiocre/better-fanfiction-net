/**
 * @import {Story, StoryParams} from "../types.js"
 */

const sqlite3 = require('better-sqlite3');
const utils = require('./utils');
const path = require('node:path');

let db;

function init(filename) {
    try {
        const dbPath = path.resolve(__dirname, '..', filename);
        db = sqlite3(dbPath);
    } catch (error) {
        utils.log('Database file could not be found');
        throw error;
    }
    db.pragma('foreign_keys = ON');
    db.pragma('journal_mode = WAL');
}

function saveFandoms(fandoms) {
    if (!db) {
        throw Error('Database connection has not been established');
    }
    try {
        const insert = db.prepare('INSERT OR REPLACE INTO fandom (id, name, category) VALUES(?, ?, ?)');

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
        throw Error('Database connection has not been established');
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
}

function saveCommunity(community) {
    if (!db) {
        throw Error('Database connection has not been established');
    }

    let fandom = typeof community.fandom === 'number' ? {id: community.fandom} : getFandomByName(community.fandom);

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
        throw Error('Database connection has not been established');
    }

    let chars = new Set(characters);
    if (pairings) {
        for (const pair of pairings) {
            for (const char of pair) {
                chars.add(char);
            }
        }
    }

    try {
        const insert = db.prepare('INSERT OR IGNORE INTO character (name, fandom_id, crossover) VALUES(?, ?, ?)');
        const insertMany = db.transaction((chars, fandomId, xfandomId) => {
            for (const char of chars) {
                insert.run(char, fandomId, xfandomId === null ? 0 : 1);
                if (xfandomId) {
                    insert.run(char, xfandomId, xfandomId === null ? 0 : 1);
                }
            }
        });

        insertMany(chars, fandomId, xfandomId);

        const update = db.prepare('UPDATE OR IGNORE character SET crossover = ? WHERE name = ? AND fandom_id = ?');
        const updateMany = db.transaction((chars, fandomId, xfandomId) => {
            for (const char of chars) {
                if (!xfandomId) {
                    update.run(0, char, fandomId);
                }
            }
        });

        updateMany(chars, fandomId, xfandomId);
    } catch (error) {
        utils.warn(error);
        return -1;
    }

    return 0;
}

/**
 * @param {Array<Story>} stories
 * @returns
 */
function saveStories(stories) {
    if (!db) {
        throw Error('Database connection has not been established');
    }

    let authors = stories.map(story => story.author);
    authors = [
        ...new Map(authors.map(obj => [obj.id, obj])).values()
    ];
    saveAuthors(authors);

    let community = stories[0]?.community;
    if (community) {
        saveCommunity(community);
    }

    let saved = [];
    
    const storyTransaction = db.transaction((/**@type {Story}*/ story) => {
        try {
            let fandom = typeof story.fandom === 'number' ? { id: story.fandom } : getFandomByName(story.fandom, story.xfandom);
            let xfandom = typeof story.xfandom === 'number' ? { id: story.xfandom } : getFandomByName(story.xfandom);

            if (!fandom) {
                utils.warn('Could not find fandom, maybe try running getFandoms again: ', { name: story.fandom });
                return;
            }
            if (story.xfandom && !xfandom) {
                utils.warn('Could not find xfandom, maybe try running getFandoms again: ', { name: story.xfandom });
                return;
            }
            saveCharacters(story.characters, story.pairings, fandom.id, xfandom?.id);

            const insert = db.prepare('INSERT OR REPLACE INTO story (id, author_id, fandom_id, xfandom_id, rating, language, chapters, words, reviews, favs, follows, updated, published, completed, genreA, genreB, image_id) VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
            insert.run(story.id, story.author.id, fandom.id, xfandom?.id, story.rated, story.language, story.chapters, story.words, story.reviews, story.favs, story.follows, story.updated, story.published, story, story.completed?1:0, story.genreA, story.genreB, story.image);
            
            const delteTexts = db.prepare('DELETE FROM story_texts WHERE id = ?');
            delteTexts.run(story.id);

            const insertTexts = db.prepare('INSERT INTO story_texts (id, title, description) VALUES(?, ?, ?)');
            insertTexts.run(story.id, story.title, story.description);

            /**@type {Array<[Number, Number]>} */
            let characters = [];
            for (const char of story.characters) {
                let loadedChar = getCharacterByNameAndFandom(char, fandom.id);
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

            for (let i = 0; i < story.pairings.length; i++) {
                let pairCharacter = [];
                for (let char of story.pairings[i]) {
                    let loadedChar =  getCharacterByNameAndFandom(char, fandom.id);
                    if (loadedChar) {
                        characters.push([loadedChar.id, i + 1]);
                    }
                    if (xfandom) {
                        let loadedChar =  getCharacterByNameAndFandom(char, xfandom.id);
                        if (loadedChar) {
                            characters.push([loadedChar.id, i + 1]);
                        }
                    }
                }
                characters = characters.concat(pairCharacter);
            }

            characters = [
                ...new Map(characters.map(obj => [obj[0], obj])).values()
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
            utils.log(error);
        }
    }
    return saved;
}

function getFandoms() {
    if (!db) {
        throw Error('Database connection has not been established');
    }

    const stmt = db.prepare('SELECT * FROM `fandom`');
    return stmt.all();
}

function getFandomCount() {
    if (!db) {
        throw Error('Database connection has not been established');
    }

    const stmt = db.prepare('SELECT COUNT(*) as count FROM `fandom`');
    return stmt.get();
}

function getFandomsByCategory(category) {
    if (!db) {
        throw Error('Database connection has not been established');
    }

    const stmt = db.prepare('SELECT * FROM `fandom` WHERE `category` = ?');
    return stmt.get(category);
}

function getStoryById(id) {
    if (!db) {
        throw Error('Database connection has not been established');
    }
    
    const stmt = db.prepare('SELECT s.*, st.title, st.description FROM `story` s JOIN `story_texts` st ON s.id = st.id WHERE s.id = ?');
    return stmt.get(id);
}

/**
 * @param {StoryParams} params
 * @returns {Array<any>}
 */
function getStories(params) {
    if (!db) {
        throw Error('Database connection has not been established');
    }

    const sortings = {
        relavance: 'ORDER BY rank asc, coalesce(updated, published) desc',
        update: 'ORDER BY coalesce(updated, published) desc, rank asc',
        publish: 'ORDER BY published desc, rank asc',
        reviews: 'ORDER BY reviews desc, rank asc',
        favorites: 'ORDER BY favs desc, rank asc',
        follows: 'ORDER BY follows desc, rank asc',
        words: 'ORDER BY words desc, rank asc',
    };

    let searchString = `
        SELECT res.*
            , highlight(story_texts, 1, '<b>', '</b>') as title
            , highlight(story_texts, 2, '<b>', '</b>') as description
        FROM (
            SELECT s.*
                , count(*) over() as count
                , a.name as author_name
                , f.name as fandom
                , fx.name as xfandom
                , rank
            FROM story s
            JOIN story_texts st ON s.id = st.id
            JOIN author a ON s.author_id = a.id
            JOIN fandom f ON s.fandom_id = f.id
            LEFT JOIN fandom fx ON s.xfandom_id = fx.id
            WHERE 1 = 1
                ${params?.title && params?.title !== '' && 'AND story_texts MATCH $title'}
                ${params?.description && params?.description !== '' && 'AND story_texts MATCH $description'}
                ${params?.fandom && params?.fandom !== '' && 'AND f.name == $fandom'}
                ${params?.datefrom && params?.datefrom !== '' && 'AND coalesce(s.updated, s.published) >= $datefrom'}
                ${params?.dateuntil && params?.dateuntil !== '' && 'AND coalesce(s.updated, s.published) <= $dateuntil'}
                ${params?.pubDateFrom && params?.pubDateFrom !== '' && 'AND s.published >= $pubDateFrom'}
                ${params?.pubDateUntil && params?.pubDateUntil !== '' && 'AND s.published <= $pubDateUntil'}
            ${sortings[params.sort] ?? sortings.relavance}
            LIMIT $limit OFFSET $offset
        ) as res
        JOIN story_texts ht ON ht.id = res.id
        WHERE 1 = 1
            ${params?.title && params?.title !== '' && 'AND story_texts MATCH $title'}
            ${params?.description && params?.description !== '' && 'AND story_texts MATCH $description'}
        ${sortings[params.sort] ?? sortings.relavance}
        ;`;

    const stmt = db.prepare(searchString);

    console.log(searchString);

    let offset = (params.page - 1) * params.limit ?? 0;

    /**@type {Array<Story>} */
    let stories;

    try {
        stories = stmt.all({
            limit: params.limit,
            offset: offset,
            title: `title:${params.title}`,
            description: `description:${params.description}`,
            fandom: params.fandom,
            datefrom: utils.dateStringToUnix(params.datefrom),
            dateuntil: utils.dateStringToUnix(params.dateuntil),
            pubDateFrom: utils.dateStringToUnix(params.pubDateFrom),
            pubDateUntil: utils.dateStringToUnix(params.pubDateUntil)
        });
    } catch (err) {
        console.log(err);
        return {
            error: `There was a error running your search, try wrapping the text searches in quotation marks. \n ${params?.title ? `${params?.title} -> "${params?.title}"` : ''}`,
        };
    }

    let total = stories[0]?.count ?? 0;

    if (total === 0 && offset > 0) {
        params.page = 1;
        return getStories(params);
    }

    for (const story of stories) {
        story.characters = [];

        let characters = getCharactersByStoryId(story.id);
        let pairings = [];
        for (const character of characters) {
            if (character.pairing === 0) {
                story.characters.push(character.name);
            } else {
                if (!pairings[character.pairing]) {
                    pairings[character.pairing] = [];
                }
                pairings[character.pairing].push(character.name);
            }
        }
        pairings.shift();
        story.pairings = pairings;
    }

    return {
        stories,
        limit: params.limit,
        count: stories.length,
        total: total,
        page: params.page
    };
}

function getCommunitiesByStoryId(storyId) {
    if (!db) {
        throw Error('Database connection has not been established');
    }
    
    const stmt = db.prepare('SELECT * FROM story_community sc INNER JOIN community c ON sc.community_id = c.id WHERE sc.story_id = ?');
    return stmt.all(storyId);
}

function getFandomByName(name, backUpName = null) {
    if (!db) {
        throw Error('Database connection has not been established');
    }

    if (!name) {
        return null;
    }

    let name2 = name
        .replaceAll('&amp;', '&')
        .replaceAll('&lt;', '<')
        .replaceAll('&gt;', '>')
        .replaceAll(`'`, `\\'`);
    let name3 = '';
    let name4 = '';

    if (backUpName) {
        backUpName = backUpName
            .replaceAll('&amp;', '&')
            .replaceAll('&lt;', '<')
            .replaceAll('&gt;', '>')
            .replaceAll(`'`, `\\'`);

        if (backUpName.includes(' & ')) {
            name3 = `${name2} & ${backUpName.split(' & ')[0]}`;
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
        throw Error('Database connection has not been established');
    }

    const stmt = db.prepare('SELECT * FROM character WHERE name = ? AND fandom_id = ?');
    return stmt.get([name, fandom_id]);
}

/**
 * @param {Number} storyId
 * @returns {Object}
 */
function getCharactersByStoryId(storyId) {
    const stmt = db.prepare(`
        SELECT DISTINCT c.name, sc.pairing
        FROM story_character sc
        INNER JOIN character c
            ON sc.character_id = c.id
        WHERE sc.story_id = ?
        ORDER BY c.name`);
    return stmt.all(storyId);
}

module.exports = {
    init,
    saveFandoms,
    saveStories,
    getFandoms,
    getFandomsByCategory,
    getStoryById,
    getCommunitiesByStoryId,
    getFandomCount,
    getStories,
};

const mysql = require("mysql2/promise");

let connection;

async function init(options) {
    try {
        connection = await mysql.createConnection(options);
    } catch (error) {
        console.log('Database connection could not be established');
        throw error;
    }
}

async function saveAuthor(author) {
    if (!connection) {
        throw Error('Database connection has not been established')  
    }

    let [rows, fields] = await connection.execute('SELECT * FROM `authors` WHERE `id` = ?', [author.id]);

    if (rows.length == 0) {
        try {
            await connection.beginTransaction();
            await connection.execute(
                'INSERT INTO `authors` VALUES (?, ?)',
                [author.id, author.name]
            );
            await connection.commit()
        } catch (error) {
            console.log(error);
            await connection.rollback()
        }        
    }
}

async function saveStory(story) {
    if (!connection) {
        throw Error('Database connection has not been established')  
    }

    await saveAuthor(story.author);

    let [rows, fields] = await connection.execute('SELECT * FROM `stories` WHERE `id` = ?', [story.id]);

    if (rows.length == 0) {
        await connection.execute(
            'INSERT INTO `stories` VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)', 
            [
                story.id, 
                story.title, 
                story.author.id,
                story.description, 
                story.fandom, 
                story.rated || null, 
                story.genres || null, 
                story.chapters, 
                story.words, 
                story.reviews, 
                story.favs, 
                story.follows, 
                story.updated || null, 
                story.published, 
                story.pairings || null, 
                story.characters || null, 
                story.completed
            ]
        );
    } else {
        await connection.execute('UPDATE `stories` SET title = ?, authorId = ?, description = ?, fandom = ?, rated = ?, genres = ?, chapters = ?, words = ?, reviews = ?, favs = ?, follows = ?, updated = ?, published = ?, pairings = ?, characters = ?, completed = ? WHERE id = ?;', 
        [
            story.title, 
            story.author.id,
            story.description, 
            story.fandom, 
            story.rated || null, 
            story.genres || null, 
            story.chapters, 
            story.words, 
            story.reviews, 
            story.favs, 
            story.follows, 
            story.updated || null, 
            story.published, 
            story.pairings || null, 
            story.characters || null, 
            story.completed,
            story.id
        ]);
    }
}

module.exports = {
    init,
    saveAuthor,
    saveStory
}
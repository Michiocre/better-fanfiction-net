const express = require('express');
require('dotenv').config({path: `${__dirname}/./../.env`});
const app = express();
const cors = require('cors');
const port = process.env.PORT;

const utils = require('./src/utils');
const parser = require('./src/parser');

let db = require('./src/db');
if (process.env.DB_TYPE == 'SQLITE') {
    db = require('./src/sqlite');
}

const corsOptions = {
    origin: 'https://www.fanfiction.net',
    optionsSuccessStatus: 200
}
app.use(cors(corsOptions));
app.use(express.json({limit: '50mb'}));

async function main() {
    utils.initLogging();
    
    try {
        if (process.env.DB_TYPE == 'SQLITE') {
            await db.init(process.env.DB_FILE);
        } else {
            await db.init({
                host: process.env.DB_HOST,
                port: process.env.DB_PORT,
                user: process.env.DB_USER,
                password: process.env.DB_PASSWORD,
                database: process.env.DB_DATABASE,
            });
        }
    } catch (error) {
        utils.error('There was an error starting the db connection.', error);
        return;
    }

    app.post('/parser/page', async (req, res) => {
        let urlParts = req.body.url.split('/');

        let parts = req.body.elements.map(utils.b64_to_utf8);
        let community = utils.b64_to_utf8(req.body.communityEl);

        let savedStories = [];

        if (urlParts[3] == 'u') {
            let stories = parser.parseUserPage(req.body.url, parts);
            utils.log('Finished parsing:', req.body.url, "storyCount:", stories.length);
            savedStories = await db.saveStories(stories);
            utils.log('Finished saving:', req.body.url, "savedCount:", savedStories.length);
        } else {
            let stories = parser.parseSearchPage(req.body.url, parts, req.body.fandomName, community, req.body.communityName);
            utils.log('Finished parsing:', req.body.url, "storyCount:", stories.length);
            savedStories = await db.saveStories(stories);
            utils.log('Finished saving:', req.body.url, "savedCount:", savedStories.length);
        }

        res.status(200).send(savedStories.map(el => ({
            id: el.id,
            time: el.updated ?? el.published,
            communities: [el.community]
        })));
    });

    app.post('/parser/fandoms', async (req, res) => {
        let fandoms = req.body.elements;
        if (await db.saveFandoms(fandoms) < 0) {
            return res.status(500).send();
        }
        return res.status(200).send();
    });

    app.get('/fandoms', async (req, res) => {
        res.send(await db.getFandoms());
    });

    app.get('/fandoms/:category', async (req, res) => {
        if (req.params.category == 'count') {
            return res.send(await db.getFandomCount());
        }
        res.send(await db.getFandomsByCategory(req.params.category));
    });

    app.post('/stories/status', async (req, res) => {
        let ids = req.body.ids;
        let stories = [];
        for (const id of ids) {
            let story = await db.getStoryById(id);
            if (story) {
                let communities = await db.getCommunitiesByStoryId(id);
                stories.push({
                    id: story.id,
                    time: story.updated ?? story.published,
                    communities: communities.map(el => ({id: el.id}))
                });
            }
        }
        res.status(200).send(stories);
    });
    
    app.listen(port, () => {
        utils.log(`Startup: Example app listening on port ${port}`);
    });
}
main();


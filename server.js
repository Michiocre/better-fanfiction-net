const express = require('express');
require('dotenv').config({path: `.env`});
const app = express();
const cors = require('cors');
const port = process.env.PORT;

const utils = require('./src/utils');
const parser = require('./src/parser');
const db = require('./src/sqlite');

const corsOptions = {
    origin: 'https://www.fanfiction.net',
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type'], // ← this is required
    optionsSuccessStatus: 200
}
app.use(cors(corsOptions));
app.options('*', cors(corsOptions)); // Enable preflight across-the-board
app.use(express.json({limit: '50mb'}));

async function main() {
    utils.initLogging();
    
    try {
        await db.init(process.env.DB_FILE);
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
            time: !el.updated ? el.published: el.updated,
            communities: [el.community]
        })));
    });

    app.post('/parser/fandoms', async (req, res) => {
        let fandoms = req.body.elements;
        if (await db.saveFandoms(fandoms) < 0) {
            utils.error(`Failed to save fandoms`);
            return res.status(500).send();
        }
        utils.log(`Saved ${fandoms.length} fandoms`);
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

    app.post('/stories', async (req, res) => {
        let params = req.body ?? {};
        if (params.limit < 1 || params.limit > 100) {
            return res.status(400).send("The limit has to be between 1 and 100 (inclusive)");
        }

        res.status(200).send(await db.getStories(params));
    });

    app.post('/stories/status', cors(corsOptions), async (req, res) => {
        let ids = req.body.ids;
        let stories = [];
        if (ids) {
            for (const id of ids) {
                let story = await db.getStoryById(id);
                if (story) {
                    let communities = await db.getCommunitiesByStoryId(id);
                    stories.push({
                        id: story.id,
                        time: !story.updated ? story.published: story.updated,
                        communities: communities?.map(el => ({id: el.id}))
                    });
                }
            }
        }
        res.status(200).send(stories);
    });

    app.get('/characters/:fandomId', async (req, res) => {
        res.send(await db.getCharactersByFandomId(req.params.fandomId));
    });
    
    app.listen(port, () => {
        utils.log(`Startup: Example app listening on port ${port}`);
    });
}
main();


const express = require('express');
require('dotenv').config({path: `${__dirname}/./../.env`});
const app = express();
const cors = require('cors');
const port = process.env.PORT;

const utils = require('./src/utils');
const api = require('./src/api');
const db = require('./src/db');

const corsOptions = {
    origin: 'https://www.fanfiction.net',
    optionsSuccessStatus: 200
}
app.use(cors(corsOptions));
app.use(express.json({limit: '50mb'}));

async function main() {
    utils.initLogging();
    
    try {
        await db.init({
            host: process.env.DB_HOST,
            port: process.env.DB_PORT,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_DATABASE,
        });
    } catch (error) {
        utils.error('There was an error starting the db connection.', error);
        return;
    }

    let savingQueue = [];

    app.post('/parser/page', async (req, res) => {
        let urlParts = req.body.url.split('/');

        let parts = req.body.elements.map(utils.b64_to_utf8);
        let community = utils.b64_to_utf8(req.body.communityEl);

        if (urlParts[3] == 'u') {
            let stories = api.parseUserPage(req.body.url, parts);
            savingQueue.push(stories);
            utils.log('Finished parsing:', req.body.url, "storyCount:", stories.length);
        } else {
            let stories = api.parseSearchPage(req.body.url, community, parts);
            savingQueue.push(stories);
            utils.log('Finished parsing:', req.body.url, "storyCount:", stories.length);
        }
        res.status(200).send();
    });

    app.post('/parser/fandoms', async (req, res) => {
        let links = req.body.elements.map(utils.b64_to_utf8);
        await api.loadFandoms(req.body.url, links);
        res.status(200).send();
    });

    app.get('/fandoms', async (req, res) => {
        res.send(await db.getFandoms());
    });

    app.get('/fandoms/:category', async (req, res) => {
        res.send(await db.getFandomsByCategory(req.params.category));
    });

    app.get('/story/:id/updated', async (req, res) => {
        let story = await db.getStoryById(req.params.id);
        if (!story) {
            return res.send({id: null});
        }
        let communities = await db.getCommunitiesByStoryId(req.params.id);
        res.send({id: story.id, time: story.updated ?? story.published, communities: communities.map(el => el.id)});
    });
    
    app.listen(port, () => {
        utils.log(`Startup: Example app listening on port ${port}`);
    });

    let doneSaving = true;
    setInterval(async () => {
        if (doneSaving) {
            doneSaving = false;
            for (let i = 0; i < savingQueue.length; i++) {
                let stories = savingQueue.shift();
                await db.saveStories(stories);
            }
            doneSaving = true;
        }
    }, 1000);
}
main();


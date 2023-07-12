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

async function main() {
    utils.initLogging();
    await db.init({
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_DATABASE,
    });

    await api.init();

    let maxConcurrent = 10;
    let currentUsage = 0;
    let crawlerQueue = [];

    let savingQueue = [];

    // for (let i = 0; i < 100; i++) {
    //     crawlerQueue.push({type: 'page', params: ['book', 'Harry-Potter', i]})
    // }

    // crawlerQueue.push({type:'url', params: ['https://www.fanfiction.net/book/Harry-Potter/?&srt=2&r=10&p=31697']})
    // crawlerQueue.push({type:'url', params: ['https://www.fanfiction.net/book/Harry-Potter/?&srt=2&r=10&p=0']})
    //crawlerQueue.push({type: 'page', params: ['book', 'Harry-Potter', 0]})
    //crawlerQueue.push({type: 'page', params: ['book', 'Harry-Potter', -1]})

    //utils.log('Loading list of fandoms');
    //await api.loadFandoms();

    app.get('/crawler/clearQueue', (req, res) => {
        crawlerQueue = [];
    });

    app.get('/crawler/loadFandoms', (req, res) => {
        api.loadFandoms();
        res.send('Started loading fandoms');
    });
 
    app.get('/crawler', (req, res) => {
        res.send(crawlerQueue.map(entry => entry.params.join(',')).join('<br>'));
    });
    
    app.get('/crawler/u/:id/:username?', async (req, res) => {
        crawlerQueue.push({type: 'authorId', params: [req.params.id]});
        res.send('Your request has been added to the <a href="/queue">queue</a>');
    });

    app.get('/crawler/j/', async (req, res) => {
        let url = `https://www.fanfiction.net/j/`;
        crawlerQueue.push({type: 'url', params: [url]});
        res.send('Your request has been added to the <a href="/crawler">queue</a>');
    });

    app.get('/crawler/j/:t/:c/:l/', async (req, res) => {
        let url = `https://www.fanfiction.net/j/${req.params.t}/${req.params.c}/${req.params.l}/`;
        crawlerQueue.push({type: 'url', params: [url]});
        res.send('Your request has been added to the <a href="/crawler">queue</a>');
    });

    app.get('/crawler/community/:name/:id/', async (req, res) => {
        let url = `https://www.fanfiction.net/community/${req.params.name}/${req.params.id}`;
        crawlerQueue.push({type: 'url', params: [url]});
        res.send('Your request has been added to the <a href="/crawler">queue</a>');
    });

    app.get('/crawler/community/:name/:id/:r/:s/:p/:g/:w/:c/:t', async (req, res) => {
        let url = `https://www.fanfiction.net/community/${req.params.name}/${req.params.id}/${req.params.r}/${req.params.s}/${req.params.p}/${req.params.g}/${req.params.w}/${req.params.c}/${req.params.t}`;
        crawlerQueue.push({type: 'url', params: [url]});
        res.send('Your request has been added to the <a href="/crawler">queue</a>');
    });

    app.get('/crawler/page/:category/:fandom/:page', async (req, res) => {
        crawlerQueue.push({type: 'page', params: [req.params.category, req.params.fandom, req.params.page]});
        res.send('Your request has been added to the <a href="/crawler">queue</a>');
    });

    app.get('/crawler/:category/:fandom/', async (req, res) => {
        let url = `https://www.fanfiction.net/${req.params.category}/${req.params.fandom}/?`;
        for (let [key, value] of Object.entries(req.query)) {
            url += `&${key}=${value}`;
        }
        crawlerQueue.push({type: 'url', params: [url]});
        res.send('Your request has been added to the <a href="/crawler">queue</a>');
    });

    app.get('/crawler/:crossovername/:fandomId/:xfandomId', async (req, res) => {
        let url = `https://www.fanfiction.net/${req.params.crossovername}/${req.params.fandomId}/${req.params.xfandomId}/?`;
        for (let [key, value] of Object.entries(req.query)) {
            url += `&${key}=${value}`;
        }
        crawlerQueue.push({type: 'url', params: [url]});
        res.send('Your request has been added to the <a href="/crawler">queue</a>');
    });



    app.get('/fandoms', async (req, res) => {
        res.send(await db.getFandoms());
    });

    app.get('/story/:id/updated', async (req, res) => {
        let story = await db.getStoryById(req.params.id);
        if (!story) {
            return res.send({id: null});
        }
        res.send({id: story.id, time: story.updated ?? story.published});
    });
    
    app.listen(port, () => {
        utils.log(`Startup: Example app listening on port ${port}`);
    });

    let doneSaving = true;

    let functionMap = {
        'authorId': api.loadUserPage,
        'page': api.loadSearchPageNr,
        'url': api.loadSearchPage
    }

    setInterval(async () => {
        let freeSpots = maxConcurrent - currentUsage;

        for (let i = 0; i < Math.min(freeSpots, crawlerQueue.length); i++) {
            let request = crawlerQueue.shift();

            currentUsage++;
            functionMap[request.type](...request.params).then(async ([url, stories]) => {
                savingQueue.push(stories);
                utils.log('Finished request:', request.type, ...request.params);
                currentUsage--;
            });
        }

    }, 1000);
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


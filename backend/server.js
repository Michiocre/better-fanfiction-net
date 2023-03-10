const express = require('express');
require('dotenv').config({path:__dirname+'/./../.env'});
const app = express();
const port = process.env.PORT;

const utils = require('./src/utils');
const api = require('./src/api');
const db = require('./src/db');


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

    // for (let i = 0; i < 2; i++) {
    //     crawlerQueue.push({type: 'page', params: ['book', 'Harry-Potter', i]})
    // }

    crawlerQueue.push({type:'url', params: ['https://www.fanfiction.net/book/Harry-Potter/?&srt=2&r=10&p=31697']})
    crawlerQueue.push({type:'url', params: ['https://www.fanfiction.net/book/Harry-Potter/?&srt=2&r=10&p=31698']})

    app.get('/clearQueue', (req, res) => {
        crawlerQueue = [];
    });
 
    app.get('/queue', (req, res) => {
        res.send(crawlerQueue.map(entry => entry.params.join(',')).join('<br>'));
    });
    
    app.get('/u/:id', async (req, res) => {
        crawlerQueue.push({type: 'authorId', params: [req.params.id]});
        res.send('Your request has been added to the <a href="/queue">queue</a>');
    });
    
    app.get('/:category/:fandom/:page', async (req, res) => {
        crawlerQueue.push({type: 'page', params: [req.params.category, req.params.fandom, req.params.page]});
        res.send('Your request has been added to the <a href="/queue">queue</a>');
    });
    
    app.listen(port, () => {
        console.log(`Startup: Example app listening on port ${port}`);
    });

    let doneSaving = true;

    setInterval(async () => {
        let freeSpots = maxConcurrent - currentUsage;

        for (let i = 0; i < Math.min(freeSpots, crawlerQueue.length); i++) {
            let request = crawlerQueue.shift();

            if (request.type == 'authorId') {
                currentUsage++;
                api.loadUserPage(...request.params).then(async stories => {
                    for (let story of stories) {
                        savingQueue.push(story);
                    }
                    console.log('Finished authorId request: ', request.params.join(','));
                    currentUsage--;
                });
            } else if (request.type == 'page') {
                currentUsage++;
                api.loadSearchPageNr(...request.params).then(async stories => {
                    for (let story of stories) {
                        savingQueue.push(story);
                    }
                    console.log('Finished page request: ', request.params.join(','));
                    currentUsage--;
                });
            }else if (request.type == 'url') {
                currentUsage++;
                api.loadSearchPageUrl(...request.params).then(async stories => {
                    for (let story of stories) {
                        savingQueue.push(story);
                    }
                    console.log('Finished page request: ', request.params.join(','));
                    currentUsage--;
                });
            }
        }

    }, 1000);
    setInterval(async () => {
        if (doneSaving) {
            doneSaving = false;
            for (let i = 0; i < savingQueue.length; i++) {
                let story = savingQueue.shift();
                await db.saveStory(story);
            }
            doneSaving = true;
        }
    }, 1000);
}
main();


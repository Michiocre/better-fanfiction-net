const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());
const {executablePath} = require('puppeteer');

const Author = require('./author');
const db = require('./db');
const utils = require('./utils');

const BASE_URL = 'https://www.fanfiction.net';

let browser;
async function init() {
    if (process.env.EXECUTABLE_PATH) {
        browser = await puppeteer.launch({headless: true, executablePath: process.env.EXECUTABLE_PATH, args:['--no-sandbox']});
    } else {
        browser = await puppeteer.launch({headless: true, executablePath: executablePath()});
    }
}

async function stop() {
    await browser.close();
}

function parseDate(unixTime) {
    if (unixTime == undefined) {
        return undefined;
    } else {
        return new Date(unixTime * 1000)
    }
}

function parseNumber(content) {
    if (!content) {
        return 0;
    }
    return parseInt(content.replace(',', ''));
}

function parseChars(content) {
    if (!content) return [[], []];
    try {
        let groups = content.split('] ');
        let pairings = [];
        let characters = [];

        for (let group of groups) {
            if (group.startsWith('[')) {
                group = group.slice(1);
                if (group.endsWith(']')) {
                    group = group.slice(0, -1);
                }
                pairings.push(group.split(', '));
            } else {
                if (group.endsWith(']')) {
                    throw Error('Can`t parse characters');
                } else {
                    characters = characters.concat(group.split(', '));
                }
            }
        }
        return [pairings, characters];
        
    } catch (error) {
        utils.warn("Error parsing characters: ", content)
        throw error;
    }
}

function parseSearchDivData(content) {
    try {
        let subLines = content.split('<div')
        let description = subLines[1].split('>');
        description.shift();
        description = description.join('>');

        let pattern = RegExp(/^.*?>(?:([^-\n]+) - )?Rated: (\S+) - (\S+) (?:- (\S+) )?- Chapters: ([\d,]+) - Words: ([\d,]+) (?:- Reviews: ([\d,]+) )?(?:- Favs: ([\d,]+) )?(?:- Follows: ([\d,]+) )?(?:- Updated:[^"]*"(\d+)".*? )?- Published:[^"]*"(\d+)".*n>(?: - (.+?))?<\/div.*?$/);
        let data = pattern.exec(subLines[2]);

        let completed = false;
        let pairings, characters;

        if (data[12]) {
            let endingParts = data[12].split(' - ');
            if (endingParts.length > 1) {
                completed = true;
                [pairings, characters] = parseChars(endingParts[0]);
            } else if (endingParts[0] == 'Complete') {
                completed = true;
            } else {
                [pairings, characters] = parseChars(endingParts[0]);
            }
        }

        return {
            description,
            fandom: data[1],
            rated: data[2],
            language: data[3],
            genres: data[4]?.split('/'),
            chapters: parseNumber(data[5]),
            words: parseNumber(data[6]),
            reviews: parseNumber(data[7]),
            favs: parseNumber(data[8]),
            follows: parseNumber(data[9]),
            updated: parseDate(data[10]),
            published: parseDate(data[11]),
            pairings: pairings || [],
            characters: characters || [],
            completed   
        };
    } catch (error) {
        utils.warn('Cant parse search div lower data:', content);   
    }
}

function parseSearchDivHeader(content) {
    try {
        let pattern = new RegExp(/^<a.*?href="\/s\/(\d*).*src="([^"]*)"[^>]*>(.*?)<\/a>(?:.*?href="\/s.*?<\/a>)?.*?href="\/u\/(\d+).*?>(.*?)<\/a>(?:.*?href="\/r.*?)?$/);
        let data = pattern.exec(content);

        return {
            id: parseNumber(data[1]),
            image: data[2],
            title: data[3],
            author: {
                id: parseNumber(data[4]),
                name: data[5]
            }
        }
    } catch (error) {
        utils.warn('Cant parse search div header: ', content);
    }
}

function parseSearchDiv(content) {
    let lines = content.split('\n');

    let headerData = parseSearchDivHeader(lines[0]);

    let lowerData = parseSearchDivData(lines[1]);
    return {...headerData, ...lowerData};
}

async function loadSearchPage(url, page = null) {
    if (!page) {
        page = await browser.newPage();
    }

    let urlParts = url.split('/');

    await page.goto(url);

    let parts = await page.$$eval('.z-list', parts => {
        return parts.map(el => el.innerHTML);
    });

    let stories = [];

    for (let part of parts) {
        stories.push(parseSearchDiv(part));
    }

    for (let story of stories) {
        if (!story.fandom) {
            story.fandom = urlParts[4];
        }
    }

    return [url, stories];
}

async function loadSearchPageNr(category, fandom, pageNr) {
    let page = await browser.newPage();

    let lastPage;
    if (pageNr < 0) {
        pageNr = -pageNr;
    } else {
        await page.goto(`${BASE_URL}/${category}/${fandom}/?&srt=2&r=10`);
        const url = await page.$$eval('center a', links => {
            let last = links[links.length - 2];
            return [last.innerHTML, last.getAttribute('href')];
        });

        lastPage = parseInt(url[1].split('=')[3]);
        pageNr = lastPage - pageNr;
    }

    return await loadSearchPage(`${BASE_URL}/${category}/${fandom}/?&srt=2&r=10&p=${pageNr}`, page);
}

async function loadUserPage(userId) {
    if (!page) {
        page = await browser.newPage();
    }

    await page.goto(url);
    const data = await page.$$('.z-list');

    let urlParts = url.split('/');

    let stories = [];

    for (let block of data) {
        try {
            let aHandlers = await block.$$('a');
            let dataDiv = await block.$('div');
            let dataInnerDiv = await dataDiv.$('.z-padtop2');
        
            let metaData = await page.evaluate(el => el.innerHTML, dataInnerDiv);
            let metaDataText = await page.evaluate(el => el.textContent, dataInnerDiv);
            let description = await page.evaluate(el => el.textContent, dataDiv);
            description = description.slice(0, -metaDataText.length)
        
            let titleValues = await page.evaluate(el => {
                return {
                    id: parseNumber(el.getAttribute('href').split('/')[2]),
                    title: el.textContent,
                }
            }, aHandlers[0]);

            aHandlers.shift();

            let authorValues = {};
            for (let a of aHandlers) {
                tempValues = await page.evaluate(el => {
                    return {
                        id: parseNumber(el.getAttribute('href')),
                        name: el.textContent
                    }
                }, a);

                if (tempValues.id.startsWith('/u/')) {
                    authorValues.id = parseNumber(tempValues.id.split('/')[2]);
                    authorValues.name = tempValues.name;
                    break;
                }
            }

            if (!authorValues.id) {
                authorValues.id = parseNumber(urlParts[4]);

                let wrapper = await page.$('#content_wrapper_inner');
                let authorSpan = await wrapper.$('span');

                authorValues.name = await page.evaluate(el => el.textContent.trim(), authorSpan);
            }

            let metaValues = parseSearchDivData(metaData, urlParts[4]);

            stories.push({...titleValues, author: new Author(authorValues.id, authorValues.name), description, ...metaValues});
        } catch (error) {
            utils.warn('Could not load one block on page ' + url + ' here is the block:\n', await page.evaluate(el => el.innerHTML, block), error);
        }
    }

    await page.close();
    utils.log('Finished request:', url);
    return stories;
}

async function loadFandoms() {
    let page = await browser.newPage();

    await page.goto(BASE_URL);
    let categories = await page.$$eval('#gui_table2i a', el => el.map(a => a.getAttribute('href').split('/')[2]));
    
    for (let category of categories) {
        await page.goto(BASE_URL + '/crossovers/' + category + '/');
        let fandoms = await page.$$eval('#list_output a', el => el.map(a => ({
            name: a.getAttribute('href').split('/')[2],
            id: parseInt(a.getAttribute('href').split('/')[3]),
            display: a.textContent
        })));
        await db.saveFandoms(category, fandoms);
        utils.log('Loaded fandom ' + category);
    }

    await page.close();
}

module.exports = {
    init,
    stop,
    parseDate,
    parseNumber,
    parseChars,
    parseSearchDivData,
    loadSearchPage,
    loadSearchPageNr,
    loadUserPage,
    loadFandoms
}
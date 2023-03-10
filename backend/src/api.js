const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());
const {executablePath} = require('puppeteer');
const Author = require('./author');

const BASE_URL = 'https://www.fanfiction.net';
let browser;
let page;

async function init() {
    browser = await puppeteer.launch({headless: true, executablePath: executablePath(), args:[]});
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
        console.error("Error parsing characters: ", content)
        throw error;
    }
}

function parseSearchDiv(content, fandom) {
    try {
        let pattern = RegExp(/^(?:([^-\n]+) - )?Rated: (\S+) - (\S+) (?:- (\S+) )?- Chapters: ([\d,]+) - Words: ([\d,]+) (?:- Reviews: ([\d,]+) )?(?:- Favs: ([\d,]+) )?(?:- Follows: ([\d,]+) )?(?:- Updated:[^"]*"(\d+)".*? )?- Published:[^"]*"(\d+)".*n>(?: - (.+?))?(?: - (Complete))?$/);
        let data = pattern.exec(content);

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
            fandom: data[1] || fandom,
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
        console.error("Error parsing characters: ", content, error);
    }
}

async function loadSearchPageUrl(url) {
    const page = await browser.newPage();
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
                    id: el.getAttribute('href').split('/')[2],
                    title: el.textContent,
                }
            }, aHandlers[0]);

            aHandlers.shift();

            let authorValues = {};
            for (let a of aHandlers) {
                tempValues = await page.evaluate(el => {
                    return {
                        id: el.getAttribute('href'),
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

            let metaValues = parseSearchDiv(metaData, urlParts[4]);

            stories.push({...titleValues, author: new Author(authorValues.id, authorValues.name), description, ...metaValues});
        } catch (error) {
            console.log('Could not load one block on page ' + url + ' here is the block:\n', await page.evaluate(el => el.innerHTML, block), error);
        }
    }
    
    return stories;
}

async function loadSearchOgPageNr(category, fandom, ogPageNr) {
    return await loadSearchPageUrl(`${BASE_URL}/${category}/${fandom}/?&srt=2&r=10&p=${ogPageNr}`);
}

async function loadSearchPageNr(category, fandom, pageNr) {
    let lastPage;
    if (pageNr < 1) {
        pageNr = -pageNr;
    } else {
        const page = await browser.newPage();
        await page.goto(`${BASE_URL}/${category}/${fandom}/?&srt=2&r=10`);
        const center = await page.$('center');
        const aHandlers = await center.$$('a');
    
        let url;
        for (let a of aHandlers) {
            url = await page.evaluate(el => [el.innerHTML, el.getAttribute('href')], a);
            if (url[0] == 'Last') {
                break;
            }
        }
    
        lastPage = parseInt(url[1].split('=')[3]);
        pageNr = lastPage - pageNr;
    }

    return await loadSearchPageUrl(`${BASE_URL}/${category}/${fandom}/?&srt=2&r=10&p=${pageNr}`);
}

async function loadUserPage(userId) {
    return await loadSearchPageUrl(`${BASE_URL}/u/${userId}`);
}

module.exports = {
    init,
    loadSearchPageUrl,
    loadSearchPageNr,
    loadUserPage
}
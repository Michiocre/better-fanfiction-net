const utils = require('./utils');

function parseNumberOrNull(content) {
    if (!content) {
        return null;
    }
    return parseNumber(content);
}

function parseNumber(content) {
    if (!content) {
        return 0;
    }
    if (typeof content === 'number') {
        return content;
    }
    return parseInt(content.replace(',', ''));
}

function parseDate(unixTime) {
    if (unixTime === undefined) {
        return undefined;
    } else {
        return new Date(unixTime * 1000);
    }
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
        utils.warn('Error parsing characters: ', content);
        throw error;
    }
}

function parseSearchDivData(content) {
    try {
        let subLines = content.split('<div');
        let description = subLines[1].split('>');
        description.shift();
        description = description.join('>');

        const pattern = RegExp(/^.*?>(?:(?:Crossover - ([^\n]+?) &amp; ([^\n]+) - )|([^\n]+) - )?Rated: (\S+) - (\S+) (?:- (\S+) )?- Chapters: ([\d,]+) - Words: ([\d,]+) (?:- Reviews: ([\d,]+) )?(?:- Favs: ([\d,]+) )?(?:- Follows: ([\d,]+) )?(?:- Updated:[^"]*"(\d+)".*? )?- Published:[^"]*"(\d+)".*n>(?: - (.+?))?<\/div.*?$/);
        let data = pattern.exec(subLines[2]);

        let completed = false;
        let pairings, characters;

        if (data[14]) {
            let endingParts = data[14].split(' - ');
            if (endingParts.length > 1) {
                completed = true;
                [pairings, characters] = parseChars(endingParts[0]);
            } else if (endingParts[0] === 'Complete') {
                completed = true;
            } else {
                [pairings, characters] = parseChars(endingParts[0]);
            }
        }

        let genres = [null, null];

        if (data[6]) {
            let parts = data[6].split('/');
            if (parts.length === 1) {
                genres[0] = parts[0];
            } else if (parts.length === 2) {
                if (parts[0] === 'Hurt') {
                    genres[0] = parts.join('/');
                } else {
                    genres = parts;
                }
            } else if (parts.length === 3) {
                if (parts[0] === 'Hurt') {
                    genres[0] = `${parts[0]}/${parts[1]}`;
                    genres[1] = parts[2];
                } else {
                    genres[0] = parts[0];
                    genres[1] = `${parts[1]}/${parts[2]}`;
                }
            }
        }

        return {
            description,
            fandom: data[1] || data[3],
            xfandom: data[2] || null,
            rated: data[4],
            language: data[5],
            genreA: genres[0],
            genreB: genres[1],
            chapters: parseNumber(data[7]),
            words: parseNumber(data[8]),
            reviews: parseNumber(data[9]),
            favs: parseNumber(data[10]),
            follows: parseNumber(data[11]),
            updated: parseNumberOrNull(data[12]),
            published: parseNumber(data[13]),
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
        return {
            id: parseNumber(/\/s\/(\d+)/.exec(content)[1]),
            image: parseNumberOrNull(/\/image\/(\d+)/.exec(content)?.[1]),
            title: /"66">(.*?)<\/a>/.exec(content)[1],
            author: {
                id: parseNumber(/\/u\/(\d+)/.exec(content)?.[1]),
                name: /\/u\/[^>]*>(.*?)<\/a>/.exec(content)?.[1],
            }
        };
    } catch (error) {
        utils.warn('Cant parse search div header: ', content, error);
    }
}

function parseSearchDiv(content) {
    content = content.replaceAll('<b>', '');
    content = content.replaceAll('</b>', '');
    let lines = content.split('\n');

    let headerData = parseSearchDivHeader(lines.shift());

    let lowerData = parseSearchDivData(lines.join(' '));
    return { ...headerData, ...lowerData };
}

function parseCommunityDiv(content) {
    let pattern = new RegExp(/^.*arrow".*?> ([^<>]+), Since: ([\d-]+).*?Founder: <a href="\/u\/(\d+).*?>(.*?)<.+? Stories: ([\d,]+) - Followers: ([\d,]+).*?id: ([\d,]+).*?<ol>(.*?)<\/ol>.*?<div>(.*?)<\/div>.*?$/gs);
    let data = pattern.exec(content);

    let staffStrings = data[8].split('</li>');
    staffStrings.pop();

    let staffPattern = new RegExp(/u\/(\d+)[^>]*>(.*?)<\/a>/);
    let staff = [];
    if (staffStrings) {
        staff = staffStrings.map(el => {
            let x = staffPattern.exec(el);

            return {
                id: parseNumber(x[1]),
                name: x[2]
            };
        });
    }

    return {
        id: parseNumber(data[7]),
        author: {
            id: parseNumber(data[3]),
            name: data[4]
        },
        staff: staff,
        fandom: data[1],
        start_date: data[2],
        story_count: parseNumber(data[5]),
        follower: parseNumber(data[6]),
        description: data[9]
    };
}

function parseSearchPage(url, parts, fandomName, communityHeader, communityName) {
    let urlParts = url.split('/');

    let stories = [];

    for (const part of parts) {
        stories.push(parseSearchDiv(part));
    }

    let community = null;
    if (urlParts[3].endsWith('community')) {
        community = parseCommunityDiv(communityHeader);
        community.name = communityName;
    }

    for (const story of stories) {
        if (!story.fandom) {
            if (urlParts[3].endsWith('Crossovers')) {
                story.fandom = parseNumber(urlParts[4]);
                story.xfandom = parseNumber(urlParts[5]);
            } else {
                story.fandom = fandomName;
            }
        }
        story.community = community;
    }

    return stories;
}

function parseUserPage(url, parts) {
    let urlParts = url.split('/');

    let stories = [];

    for (const part of parts) {
        let story = parseSearchDiv(part);

        if (story.author.id === 0) {
            story.author.id = parseNumber(urlParts[4]);
            story.author.name = urlParts[5];
        }

        stories.push(story);
    }
    return stories;
}

module.exports = {
    parseDate,
    parseNumber,
    parseNumberOrNull,
    parseChars,
    parseSearchDivData,
    parseCommunityDiv,
    parseSearchPage,
    parseUserPage,
    parseSearchDivHeader,
};

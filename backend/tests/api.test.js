const api = require('../src/api');

test('api parseNumber', () => {
    expect(api.parseNumber('10')).toBe(10);
    expect(api.parseNumber('-10')).toBe(-10);
    expect(api.parseNumber('1,000')).toBe(1000);
    expect(api.parseNumber('10.50')).toBe(10);
});

test('api parseDate', () => {
    expect(api.parseDate(0)).toStrictEqual(new Date(0));
    let currentUnix = new Date().getTime();
    expect(api.parseDate(currentUnix / 1000)).toStrictEqual(new Date(currentUnix));
    expect(api.parseDate(undefined)).toBe(undefined);
});

test('api parseChars', () => {
    expect(api.parseChars(``)).toStrictEqual([[],[]]);
    expect(api.parseChars(`Hermione G.`)).toStrictEqual([[], ['Hermione G.']]);
    expect(api.parseChars(`Harry P., Hermione G.`)).toStrictEqual([[], ['Harry P.', 'Hermione G.']]);
    expect(api.parseChars(`[Harry P., Hermione G.]`)).toStrictEqual([[['Harry P.', 'Hermione G.']], []]);
    expect(api.parseChars(`[Harry P., Hermione G., Fleur D., N. Tonks]`)).toStrictEqual([[['Harry P.', 'Hermione G.', 'Fleur D.', 'N. Tonks']], []]);
    expect(api.parseChars(`[Hermione G., Draco M.] Sirius B., Regulus B.`)).toStrictEqual([[['Hermione G.', 'Draco M.']], ['Sirius B.', 'Regulus B.']]);
    expect(api.parseChars(`[Severus S., Sirius B.] [Lily Evans P., James P.]`)).toStrictEqual([[['Severus S.', 'Sirius B.'], ['Lily Evans P.', 'James P.']], []]);
    expect(() => api.parseChars(`Harry P., Hermione G. [Hermione G., Draco M.]`)).toThrow('Can`t parse characters');
});

test('api parseSearchDivData', () => {
    expect(
        api.parseSearchDivData(`<div class="z-indent z-padtop">Description<div class="z-padtop2 xgray">Har-ry Potter - Rated: K+ - English - Angst/Romance - Chapters: 4 - Words: 4,669 - Reviews: 24 - Favs: 4 - Follows: 3 - Updated: <span data-xutime="989132400">May 6, 2001</span> - Published: <span data-xutime="988527600">Apr 29, 2001</span> - Draco M., Harry P.</div></div>`)
    ).toStrictEqual({
        fandom: 'Har-ry Potter',
        xfandom: null,
        rated: 'K+',
        language: 'English',
        genreA: 'Angst',
        genreB: 'Romance',
        chapters: 4,
        words: 4669,
        reviews: 24,
        favs: 4,
        follows: 3,
        updated: new Date(989132400 * 1000),
        published: new Date(988527600 * 1000),
        characters: ['Draco M.', 'Harry P.'],
        pairings: [],
        completed: false,
        description: "Description"
    });

    expect(
        api.parseSearchDivData(`<div class="z-indent z-padtop">Description<div class="z-padtop2 xgray">Rated: M - English - Romance/Angst - Chapters: 49 - Words: 284,050 - Reviews: 18615 - Favs: 37,499 - Follows: 19,755 - Updated: <span data-xutime="1578190357">Jan 5, 2020</span> - Published: <span data-xutime="1283431425">Sep 2, 2010</span> - Hermione G., Draco M. - Complete</div></div>`)
    ).toStrictEqual({
        fandom: undefined,
        xfandom: null,
        rated: 'M',
        language: 'English',
        genreA: 'Romance',
        genreB: 'Angst',
        chapters: 49,
        words: 284050,
        reviews: 18615,
        favs: 37499,
        follows: 19755,
        updated: new Date(1578190357 * 1000),
        published: new Date(1283431425 * 1000),
        characters: ['Hermione G.', 'Draco M.'],
        pairings: [],
        completed: true,
        description: "Description"
    });

    expect(
        api.parseSearchDivData(`<div class="z-indent z-padtop">Description<div class="z-padtop2 xgray">Rated: M - Spanish - Hurt/Comfort/Romance - Chapters: 1 - Words: 2,918 - Published: <span data-xutime="1678461818">1h ago</span> - [Harry P., OC] Voldemort</div></div>`)
    ).toStrictEqual({
        fandom: undefined,
        xfandom: null,
        rated: 'M',
        language: 'Spanish',
        genreA: 'Hurt/Comfort',
        genreB: 'Romance',
        chapters: 1,
        words: 2918,
        reviews: 0,
        favs: 0,
        follows: 0,
        updated: undefined,
        published: new Date(1678461818 * 1000),
        characters: ['Voldemort'],
        pairings: [['Harry P.', 'OC']],
        completed: false,
        description: "Description"
    });
    
    expect(
        api.parseSearchDivData(`<div class="z-indent z-padtop">At the end of the war, Alina travels the world.<div class="z-padtop2 xgray">Crossover - Shadow and Bone &amp; House of the Dragon - Rated: T - English - Adventure/Friendship - Chapters: 1 - Words: 1,709 - Published: <span data-xutime="1689099337">6h ago</span> - Alina S., Rhaenyra T. - Complete</div></div>`)
    ).toStrictEqual({
        fandom: 'Shadow and Bone',
        xfandom: 'House of the Dragon',
        rated: 'T',
        language: 'English',
        genreA: 'Adventure',
        genreB: 'Friendship',
        chapters: 1,
        words: 1709,
        reviews: 0,
        favs: 0,
        follows: 0,
        updated: undefined,
        published: new Date(1689099337 * 1000),
        characters: ['Alina S.', 'Rhaenyra T.'],
        pairings: [],
        completed: true,
        description: "At the end of the war, Alina travels the world."
    });

    expect(
        api.parseSearchDivData(`<div class="z-indent z-padtop">After defeating both Gabriel and Lila, the miraculous team finally recovers the butterfly miraculous and live their life in peace while still protecting the city. But when new jewls emerge from the shadows, the mischievous, the team of heroes will have to unite once again to defeat the treat. Will the world be safe from the rising menace or will it fall into the darkness ?<div class="z-padtop2 xgray">Miraculous: Tales of Ladybug &amp; Cat Noir - Rated: T - English - Chapters: 1 - Words: 1,742 - Reviews: 1 - Favs: 3 - Follows: 2 - Published: <span data-xutime="1689172472">6h ago</span> - Marinette D-C./Ladybug, Adrien A./Cat Noir, Alya C./Lady Wifi/Rena Rouge, Zoé Lee/Vesperia</div></div>`)
    ).toStrictEqual({
        fandom: 'Miraculous: Tales of Ladybug &amp; Cat Noir',
        xfandom: null,
        rated: 'T',
        language: 'English',
        genreA: null,
        genreB: null,
        chapters: 1,
        words: 1742,
        reviews: 1,
        favs: 3,
        follows: 2,
        updated: undefined,
        published: new Date(1689172472 * 1000),
        characters: ['Marinette D-C./Ladybug', 'Adrien A./Cat Noir', 'Alya C./Lady Wifi/Rena Rouge', 'Zoé Lee/Vesperia'],
        pairings: [],
        completed: false,
        description: "After defeating both Gabriel and Lila, the miraculous team finally recovers the butterfly miraculous and live their life in peace while still protecting the city. But when new jewls emerge from the shadows, the mischievous, the team of heroes will have to unite once again to defeat the treat. Will the world be safe from the rising menace or will it fall into the darkness ?"
    });

    expect(
        api.parseSearchDivData(`<div class="z-indent z-padtop">Rated T for swearing and perverted suggestions. Stocking ran out of sweets, and on her quest to find some, she nearly gets into a car accident thanks to a very special card. As if to guide her onto a particular path, a card shop is near where she parks, and a certain Geek Boy is running the shop...<div class="z-padtop2 xgray">Crossover - Yu-Gi-Oh &amp; Panty &amp; Stocking with Garterbelt/パンティ＆ストッキングwithガーターベルト - Rated: T - English - Friendship/Adventure - Chapters: 8 - Words: 35,599 - Reviews: 49 - Favs: 77 - Follows: 60 - Updated: <span data-xutime="1529171293">Jun 16, 2018</span> - Published: <span data-xutime="1342375764">Jul 15, 2012</span> - Duel Monster, Stocking A.</div></div>`)
    ).toStrictEqual({
        fandom: 'Yu-Gi-Oh',
        xfandom: 'Panty &amp; Stocking with Garterbelt/パンティ＆ストッキングwithガーターベルト',
        rated: 'T',
        language: 'English',
        genreA: 'Friendship',
        genreB: 'Adventure',
        chapters: 8,
        words: 35599,
        reviews: 49,
        favs: 77,
        follows: 60,
        updated: new Date(1529171293 * 1000),
        published: new Date(1342375764 * 1000),
        characters: ['Duel Monster', 'Stocking A.'],
        pairings: [],
        completed: false,
        description: "Rated T for swearing and perverted suggestions. Stocking ran out of sweets, and on her quest to find some, she nearly gets into a car accident thanks to a very special card. As if to guide her onto a particular path, a card shop is near where she parks, and a certain Geek Boy is running the shop..."
    });
});

describe('api loadPages', () => {
    beforeAll(async () =>  await api.init());

    test('api loadPageByNr', async () => {
        let stories = await api.loadSearchPageNr('book', 'Harry-Potter', 0);
        expect(stories[1].length).toBe(25);
    }, 10000);
    
    test('api loadPageByUser', async () => {
        let stories = await api.loadUserPage(10000);
        expect(stories[1].length).toBe(4);
    }, 10000);
    
    afterAll(async () =>  await api.stop());
});


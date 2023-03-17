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

test('api parseMetaDiv', () => {
    expect(
        api.parseMetaDiv(`Harry Potter - Rated: K+ - English - Angst/Romance - Chapters: 4 - Words: 4,669 - Reviews: 24 - Favs: 4 - Follows: 3 - Updated: <span data-xutime="989132400">May 6, 2001</span> - Published: <span data-xutime="988527600">Apr 29, 2001</span> - Draco M., Harry P.`)
    ).toStrictEqual({
        fandom: 'Harry Potter',
        rated: 'K+',
        language: 'English',
        genres: [
            'Angst',
            'Romance'
        ],
        chapters: 4,
        words: 4669,
        reviews: 24,
        favs: 4,
        follows: 3,
        updated: new Date(989132400 * 1000),
        published: new Date(988527600 * 1000),
        characters: ['Draco M.', 'Harry P.'],
        pairings: [],
        completed: false

    });

    expect(
        api.parseMetaDiv(`Rated: M - English - Romance/Angst - Chapters: 49 - Words: 284,050 - Reviews: 18615 - Favs: 37,499 - Follows: 19,755 - Updated: <span data-xutime="1578190357">Jan 5, 2020</span> - Published: <span data-xutime="1283431425">Sep 2, 2010</span> - Hermione G., Draco M. - Complete`)
    ).toStrictEqual({
        fandom: undefined,
        rated: 'M',
        language: 'English',
        genres: [
            'Romance',
            'Angst'
        ],
        chapters: 49,
        words: 284050,
        reviews: 18615,
        favs: 37499,
        follows: 19755,
        updated: new Date(1578190357 * 1000),
        published: new Date(1283431425 * 1000),
        characters: ['Hermione G.', 'Draco M.'],
        pairings: [],
        completed: true

    });

    expect(
        api.parseMetaDiv(`Rated: M - Spanish - Hurt/Comfort/Romance - Chapters: 1 - Words: 2,918 - Published: <span data-xutime="1678461818">1h ago</span> - [Harry P., OC] Voldemort`)
    ).toStrictEqual({
        fandom: undefined,
        rated: 'M',
        language: 'Spanish',
        genres: [
            'Hurt',
            'Comfort',
            'Romance'
        ],
        chapters: 1,
        words: 2918,
        reviews: 0,
        favs: 0,
        follows: 0,
        updated: undefined,
        published: new Date(1678461818 * 1000),
        characters: ['Voldemort'],
        pairings: [['Harry P.', 'OC']],
        completed: false

    });

    
});

describe('api loadPages', () => {
    beforeAll(async () =>  await api.init());

    test('api loadPageByNr', async () => {
        let stories = await api.loadSearchPageNr('book', 'Harry-Potter', 0);
        expect(stories.length).toBe(25);
    }, 10000);
    
    test('api loadPageByUser', async () => {
        let stories = await api.loadUserPage(64091);
        expect(stories.length).toBe(22);
    }, 10000);
    
    afterAll(async () =>  await api.stop());
});


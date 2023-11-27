const api = require('../src/api');

test('api parseNumber', () => {
    expect(api.parseNumber('10')).toBe(10);
    expect(api.parseNumber('-10')).toBe(-10);
    expect(api.parseNumber('1,000')).toBe(1000);
    expect(api.parseNumber('10.50')).toBe(10);
    expect(api.parseNumber(10)).toBe(10);
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

test('api parseCommunityDiv', () => {
    expect(
        api.parseCommunityDiv(`
            <tbody><tr>
            <td valign="top"><img class="cimage " style="clear:left;float:left;margin-right:3px;padding:2px;border:1px solid #ccc;-moz-border-radius:2px;-webkit-border-radius:2px;" src="/image/5843845/75/" width="75" height="100"> <img src="//ff77.b-cdn.net/static/ficons/transmit_blue.png" width="16" height="16" border="0" align="absmiddle"> <a href="https://www.fanfiction.net/alert/community.php?action=add&amp;c2id=84507">Follow</a> . <a style="border:none;float:right" title="Feed" href="/atom/c2/84507/3/"><img src="//ff77.b-cdn.net/static/forum/feed.png" width="16" height="16" border="0" align="absmiddle"></a>
            <hr size="1" noshade="">
            <div>Focus: Books <span class="icon-chevron-right xicon-section-arrow"></span> Harry Potter, Since: 08-14-10</div>
            <div>Founder: <a href="/u/980211/enembee">enembee</a> - Stories: 186,7 - Followers: 5,735 - id: 84507
            </div><div id="staff" style="display:none;padding-left:100px;"><ol></ol></div>
            <div>The best stories from the best fanfiction community. Sic semper tyrannis.</div></td>
            </tr>
            </tbody>`
        )
    ).toStrictEqual({
        id: 84507,
        author: {
            id: 980211,
            name: 'enembee'
        },
        staff: [],
        fandom: 'Harry Potter',
        start_date: new Date('08-14-10'),
        story_count: 1867,
        follower: 5735,
        description: 'The best stories from the best fanfiction community. Sic semper tyrannis.'
    });

    expect(
        api.parseCommunityDiv(`
            <tbody><tr>
            <td valign="top"><img class="cimage " style="clear:left;float:left;margin-right:3px;padding:2px;border:1px solid #ccc;-moz-border-radius:2px;-webkit-border-radius:2px;" src="/image/1851204/75/" width="75" height="100"> <img src="//ff77.b-cdn.net/static/ficons/transmit_blue.png" width="16" height="16" border="0" align="absmiddle"> <a href="https://www.fanfiction.net/alert/community.php?action=add&amp;c2id=11605">Follow</a> . <a style="border:none;float:right" title="Feed" href="/atom/c2/11605/3/"><img src="//ff77.b-cdn.net/static/forum/feed.png" width="16" height="16" border="0" align="absmiddle"></a>
            <hr size="1" noshade="">
            <div>Focus: Books <span class="icon-chevron-right xicon-section-arrow"></span> Harry Potter, Since: 02-14-05</div>
            <div>Founder: <a href="/u/652101/Megami284">Megami284</a> - Stories: 689 - Followers: 1,943 - Staff: <a href="#" onclick="$('#staff').toggle();">14</a> - id: 11605
            </div><div id="staff" style="display:none;padding-left:100px;"><ol><li><a href="/u/1301475/Blissfully-Delirious">Blissfully Delirious</a></li><li><a href="/u/985486/Gallicka">Gallicka</a></li><li><a href="/u/191364/Kalariona">Kalariona</a></li><li><a href="/u/625905/Mandara">Mandara</a></li><li><a href="/u/1225954/Nicholas-Knut">Nicholas Knut</a></li><li><a href="/u/979403/OnceUponAWinchester">OnceUponAWinchester</a></li><li><a href="/u/212832/Silverfrost">Silverfrost</a></li><li><a href="/u/1171123/The-Haydster">The Haydster</a></li><li><a href="/u/1037497/The-Wykkyd">The Wykkyd</a></li><li><a href="/u/778160/Zoomi">Zoomi</a></li><li><a href="/u/546724/hypersensitive">hypersensitive</a></li><li><a href="/u/1001782/imsocrazy">imsocrazy</a></li><li><a href="/u/1199038/insaneblondemidget14">insaneblondemidget14</a></li><li><a href="/u/756958/sparkley-tangerine">sparkley-tangerine</a></li></ol></div>
            <div>Have you ever searched and searched for Harry and Draco slash but you've never found the right one to read that has you feeling like your a part of it. Well look no further than here because if you click this you will get access to the BEST HD SLASH out there. So Click, Subscribe and HAPPY reading. I am NOT accepting anymore staff members. Thanks!</div></td>
            </tr>
            </tbody>`
        )
    ).toStrictEqual({
        id: 11605,
        author: {
            id: 652101,
            name: 'Megami284'
        },
        staff: [
            { id: 1301475, name: 'Blissfully Delirious' },
            { id: 985486, name: 'Gallicka' },
            { id: 191364, name: 'Kalariona' },
            { id: 625905, name: 'Mandara' },
            { id: 1225954, name: 'Nicholas Knut' },
            { id: 979403, name: 'OnceUponAWinchester' },
            { id: 212832, name: 'Silverfrost' },
            { id: 1171123, name: 'The Haydster' },
            { id: 1037497, name: 'The Wykkyd' },
            { id: 778160, name: 'Zoomi' },
            { id: 546724, name: 'hypersensitive' },
            { id: 1001782, name: 'imsocrazy' },
            { id: 1199038, name: 'insaneblondemidget14' },
            { id: 756958, name: 'sparkley-tangerine' }
          ],
        fandom: 'Harry Potter',
        start_date: new Date('02-14-05'),
        story_count: 689,
        follower: 1943,
        description: `Have you ever searched and searched for Harry and Draco slash but you've never found the right one to read that has you feeling like your a part of it. Well look no further than here because if you click this you will get access to the BEST HD SLASH out there. So Click, Subscribe and HAPPY reading. I am NOT accepting anymore staff members. Thanks!`
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


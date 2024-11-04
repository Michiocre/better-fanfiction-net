const parser = require('../src/parser');
const expect = require('expect.js');

describe('basic parse test', () => {
    it('should parseNumber', () => {
        expect(parser.parseNumber('10')).to.be(10);
        expect(parser.parseNumber('-10')).to.be(-10);
        expect(parser.parseNumber('1,000')).to.be(1000);
        expect(parser.parseNumber('10.50')).to.be(10);
        expect(parser.parseNumber(10)).to.be(10);
    });

    it('should parseDate', () => {
        expect(parser.parseDate(0)).to.eql(new Date(0));
        let currentUnix = new Date().getTime();
        expect(parser.parseDate(currentUnix / 1000)).to.eql(new Date(currentUnix));
        expect(parser.parseDate(undefined)).to.be(undefined);
    });

    it('should parseChars', () => {
        expect(parser.parseChars(``)).to.eql([[],[]]);
        expect(parser.parseChars(`Hermione G.`)).to.eql([[], ['Hermione G.']]);
        expect(parser.parseChars(`Harry P., Hermione G.`)).to.eql([[], ['Harry P.', 'Hermione G.']]);
        expect(parser.parseChars(`[Harry P., Hermione G.]`)).to.eql([[['Harry P.', 'Hermione G.']], []]);
        expect(parser.parseChars(`[Harry P., Hermione G., Fleur D., N. Tonks]`)).to.eql([[['Harry P.', 'Hermione G.', 'Fleur D.', 'N. Tonks']], []]);
        expect(parser.parseChars(`[Hermione G., Draco M.] Sirius B., Regulus B.`)).to.eql([[['Hermione G.', 'Draco M.']], ['Sirius B.', 'Regulus B.']]);
        expect(parser.parseChars(`[Severus S., Sirius B.] [Lily Evans P., James P.]`)).to.eql([[['Severus S.', 'Sirius B.'], ['Lily Evans P.', 'James P.']], []]);
    });

    it ('should throw exception on wrong format', () => {
        expect(() => parser.parseChars(`Harry P., Hermione G. [Hermione G., Draco M.]`)).to.throwException('Can`t parse characters');
    })
});

describe('parser parseSearchDivData', () => {
    it ('should handle the basics', () => {
        expect(
            parser.parseSearchDivData(`<div class="z-indent z-padtop">Description<div class="z-padtop2 xgray">Har-ry Potter - Rated: K+ - English - Angst/Romance - Chapters: 4 - Words: 4,669 - Reviews: 24 - Favs: 4 - Follows: 3 - Updated: <span data-xutime="989132400">May 6, 2001</span> - Published: <span data-xutime="988527600">Apr 29, 2001</span> - Draco M., Harry P.</div></div>`)
        ).to.eql({
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
            updated: 989132400,
            published: 988527600,
            characters: ['Draco M.', 'Harry P.'],
            pairings: [],
            completed: false,
            description: "Description"
        });
    
        expect(
            parser.parseSearchDivData(`<div class="z-indent z-padtop">Description<div class="z-padtop2 xgray">Rated: M - English - Romance/Angst - Chapters: 49 - Words: 284,050 - Reviews: 18615 - Favs: 37,499 - Follows: 19,755 - Updated: <span data-xutime="1578190357">Jan 5, 2020</span> - Published: <span data-xutime="1283431425">Sep 2, 2010</span> - Hermione G., Draco M. - Complete</div></div>`)
        ).to.eql({
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
            updated: 1578190357,
            published: 1283431425,
            characters: ['Hermione G.', 'Draco M.'],
            pairings: [],
            completed: true,
            description: "Description"
        });
    
        expect(
            parser.parseSearchDivData(`<div class="z-indent z-padtop">Description<div class="z-padtop2 xgray">Rated: M - Spanish - Hurt/Comfort/Romance - Chapters: 1 - Words: 2,918 - Published: <span data-xutime="1678461818">1h ago</span> - [Harry P., OC] Voldemort</div></div>`)
        ).to.eql({
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
            updated: 0,
            published: 1678461818,
            characters: ['Voldemort'],
            pairings: [['Harry P.', 'OC']],
            completed: false,
            description: "Description"
        });
    });

    it ('should handle crossovers', () => {
        expect(
            parser.parseSearchDivData(`<div class="z-indent z-padtop">At the end of the war, Alina travels the world.<div class="z-padtop2 xgray">Crossover - Shadow and Bone &amp; House of the Dragon - Rated: T - English - Adventure/Friendship - Chapters: 1 - Words: 1,709 - Published: <span data-xutime="1689099337">6h ago</span> - Alina S., Rhaenyra T. - Complete</div></div>`)
        ).to.eql({
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
            updated: 0,
            published: 1689099337,
            characters: ['Alina S.', 'Rhaenyra T.'],
            pairings: [],
            completed: true,
            description: "At the end of the war, Alina travels the world."
        });
    });

    it ('should handle strange fandom names', () => {
        expect(
            parser.parseSearchDivData(`<div class="z-indent z-padtop">After defeating both Gabriel and Lila, the miraculous team finally recovers the butterfly miraculous and live their life in peace while still protecting the city. But when new jewls emerge from the shadows, the mischievous, the team of heroes will have to unite once again to defeat the treat. Will the world be safe from the rising menace or will it fall into the darkness ?<div class="z-padtop2 xgray">Miraculous: Tales of Ladybug &amp; Cat Noir - Rated: T - English - Chapters: 1 - Words: 1,742 - Reviews: 1 - Favs: 3 - Follows: 2 - Published: <span data-xutime="1689172472">6h ago</span> - Marinette D-C./Ladybug, Adrien A./Cat Noir, Alya C./Lady Wifi/Rena Rouge, Zoé Lee/Vesperia</div></div>`)
        ).to.eql({
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
            updated: 0,
            published: 1689172472,
            characters: ['Marinette D-C./Ladybug', 'Adrien A./Cat Noir', 'Alya C./Lady Wifi/Rena Rouge', 'Zoé Lee/Vesperia'],
            pairings: [],
            completed: false,
            description: "After defeating both Gabriel and Lila, the miraculous team finally recovers the butterfly miraculous and live their life in peace while still protecting the city. But when new jewls emerge from the shadows, the mischievous, the team of heroes will have to unite once again to defeat the treat. Will the world be safe from the rising menace or will it fall into the darkness ?"
        });
    
        expect(
            parser.parseSearchDivData(`<div class="z-indent z-padtop">Rated T for swearing and perverted suggestions. Stocking ran out of sweets, and on her quest to find some, she nearly gets into a car accident thanks to a very special card. As if to guide her onto a particular path, a card shop is near where she parks, and a certain Geek Boy is running the shop...<div class="z-padtop2 xgray">Crossover - Yu-Gi-Oh &amp; Panty &amp; Stocking with Garterbelt/パンティ＆ストッキングwithガーターベルト - Rated: T - English - Friendship/Adventure - Chapters: 8 - Words: 35,599 - Reviews: 49 - Favs: 77 - Follows: 60 - Updated: <span data-xutime="1529171293">Jun 16, 2018</span> - Published: <span data-xutime="1342375764">Jul 15, 2012</span> - Duel Monster, Stocking A.</div></div>`)
        ).to.eql({
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
            updated: 1529171293,
            published: 1342375764,
            characters: ['Duel Monster', 'Stocking A.'],
            pairings: [],
            completed: false,
            description: "Rated T for swearing and perverted suggestions. Stocking ran out of sweets, and on her quest to find some, she nearly gets into a car accident thanks to a very special card. As if to guide her onto a particular path, a card shop is near where she parks, and a certain Geek Boy is running the shop..."
        });
    });

    it ('should handle strange newlines', () => {
        expect(
            parser.parseSearchDivData(`<div class="z-indent z-padtop">well...it was going to be a drabble...no such luck.
                For Ivory Novelist.
                the death scene.<div class="z-padtop2 xgray">King Arthur - Rated: K+ - English - Angst/Fantasy - Chapters: 1 - Words: 1,239 - Reviews: 7 - Favs: 5 - Follows: 1 - Published: <span data-xutime="1091772486">Aug 6, 2004</span></div></div>`)
        ).to.eql({
            description: `well...it was going to be a drabble...no such luck.
                For Ivory Novelist.
                the death scene.`,
            fandom: 'King Arthur',
            xfandom: null,
            rated: 'K+',
            language: 'English',
            genreA: 'Angst',
            genreB: 'Fantasy',
            chapters: 1,
            words: 1239,
            reviews: 7,
            favs: 5,
            follows: 1,
            updated: 0,
            published: 1091772486,
            characters: [],
            pairings: [],
            completed: false
        });
    })
});

describe('parser parseCommunityDiv', () => {
    it ('should handle the basics', () => {
        expect(
            parser.parseCommunityDiv(`
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
        ).to.eql({
            id: 84507,
            author: {
                id: 980211,
                name: 'enembee'
            },
            staff: [],
            fandom: 'Harry Potter',
            start_date: '08-14-10',
            story_count: 1867,
            follower: 5735,
            description: 'The best stories from the best fanfiction community. Sic semper tyrannis.'
        });

        expect(
            parser.parseCommunityDiv(`
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
        ).to.eql({
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
            start_date: '02-14-05',
            story_count: 689,
            follower: 1943,
            description: `Have you ever searched and searched for Harry and Draco slash but you've never found the right one to read that has you feeling like your a part of it. Well look no further than here because if you click this you will get access to the BEST HD SLASH out there. So Click, Subscribe and HAPPY reading. I am NOT accepting anymore staff members. Thanks!`
        });

        expect(
            parser.parseCommunityDiv(`
                <tbody><tr>
                <td valign="top"><img class="cimage " style="clear:left;float:left;margin-right:3px;padding:2px;border:1px solid #ccc;-moz-border-radius:2px;-webkit-border-radius:2px;" src="/image/1599097/75/" width="75" height="100"> <img src="//ff77.b-cdn.net/static/ficons/transmit_blue.png" width="16" height="16" border="0" align="absmiddle"> <a href="https://www.fanfiction.net/alert/community.php?action=add&amp;c2id=117072">Follow</a> . <a style="border:none;float:right" title="Feed" href="/atom/c2/117072/3/"><img src="//ff77.b-cdn.net/static/forum/feed.png" width="16" height="16" border="0" align="absmiddle"></a>
                <hr size="1" noshade="">
                <div>Focus: General <span class="icon-chevron-right xicon-section-arrow"></span> All Categories, Since: 10-27-14</div>
                <div>Founder: <a href="/u/4643583/Yellow-Horse">Yellow Horse</a> - Stories: 11,887 - Followers: 2,684 - Staff: <a href="#" onclick="$('#staff').toggle();">5</a> - id: 117072
                </div><div id="staff" style="display:none;padding-left:100px;"><ol><li><a href="/u/3571363/GaleSynch">GaleSynch</a></li><li><a href="/u/1902231/Nee339">Nee339</a></li><li><a href="/u/9011291/RDK-Rana">RDK Rana</a></li><li><a href="/u/3827883/War-Sage">War Sage</a></li><li><a href="/u/5783496/ilovetanks">ilovetanks</a></li></ol></div>
                <div>This community's purpose is to collect original character (OC) and self insert (SI) stories. These stories come from every fan fiction category and genre on this site. Please note that some of these stories do contain graphic descriptions of sex, violence, harsh language, reincarnation and other religious themes. Read at your own risk, and I hope you enjoy your time here at the Archive for SIs and OCs. Have a nice day.</div></td>
                </tr>
                </tbody>`
            )
        ).to.eql({
            id: 117072,
            author: {
                id: 4643583,
                name: 'Yellow Horse'
            },
            staff: [
                { id: 3571363, name: 'GaleSynch' },
                { id: 1902231, name: 'Nee339' },
                { id: 9011291, name: 'RDK Rana' },
                { id: 3827883, name: 'War Sage' },
                { id: 5783496, name: 'ilovetanks' },
            ],
            fandom: 'All Categories',
            start_date: '10-27-14',
            story_count: 11887,
            follower: 2684,
            description: `This community's purpose is to collect original character (OC) and self insert (SI) stories. These stories come from every fan fiction category and genre on this site. Please note that some of these stories do contain graphic descriptions of sex, violence, harsh language, reincarnation and other religious themes. Read at your own risk, and I hope you enjoy your time here at the Archive for SIs and OCs. Have a nice day.`
        });
    });
});

describe('parser parseSearchPage', () => {
    it ('should handle the basics', () => {
        expect(parser.parseSearchPage('https://www.fanfiction.net/book/Harry-Potter/', [
            `<span class="bff_span bff_error">not registered</span><a class="stitle" href="/s/13476426/1/The-Inner-Eye"><img class="lazy cimage " style="clear: left; float: left; margin-right: 3px; padding: 2px; border: 1px solid rgb(204, 204, 204); border-radius: 2px; display: block;" src="/image/6038841/75/" data-original="/image/6038841/75/" width="50" height="66">The Inner Eye</a> <a href="/s/13476426/6/The-Inner-Eye"><span class="icon-chevron-right xicon-section-arrow"></span></a> by <a href="/u/12901889/Bluurr">Bluurr</a> <a class="reviews" href="/r/13476426/">reviews</a>
            <div class="z-indent z-padtop">AU. Petunia Evans didn't marry Vernon Dursley – instead she went for the seer, Daniel Pasturl. So when Harry Potter turns up on their doorstep, how will the couple handle it? Will Harry get the childhood he deserved? Dumbledore bashing. Ron bashing. Intelligent!Harry Seer!Harry<div class="z-padtop2 xgray">Rated: T - English - Family/Adventure - Chapters: 6 - Words: 12,368 - Reviews: 23 - Favs: 110 - Follows: 167 - Updated: <span data-xutime="1712589654">16m ago</span> - Published: <span data-xutime="1578845283">Jan 12, 2020</span> - [Petunia D., OC] Harry P.</div></div>`
        ], 'Harry-Potter', '', '')).to.eql([{
            author: {id: 12901889, name: "Bluurr"},
            chapters: 6,
            characters: ["Harry P."],
            community: null,
            completed: false,
            description: "AU. Petunia Evans didn't marry Vernon Dursley – instead she went for the seer, Daniel Pasturl. So when Harry Potter turns up on their doorstep, how will the couple handle it? Will Harry get the childhood he deserved? Dumbledore bashing. Ron bashing. Intelligent!Harry Seer!Harry",
            fandom: "Harry-Potter",
            favs: 110,
            follows: 167,
            genreA: "Family",
            genreB: "Adventure",
            id: 13476426,
            image: "/image/6038841/75/",
            language: "English",
            pairings: [["Petunia D.", "OC"]],
            published: 1578845283,
            rated: "T", 
            reviews: 23, 
            title: "The Inner Eye", 
            updated: 1712589654, 
            words: 12368, 
            xfandom: null
        }]);
    });

    it ('should handle strange fandom names', () => {
        expect(parser.parseSearchPage('https://www.fanfiction.net/j/0/3/0/', [
            `<span id="bff_span_14357894" class="bff_span bff_success" time="1716258296">up to date</span><a class="stitle" href="/s/14357894/1/Devil-of-the-Iron-Flower"><img class="lazy cimage " style="clear: left; float: left; margin-right: 3px; padding: 2px; border: 1px solid rgb(204, 204, 204); border-radius: 2px; display: block;" src="/image/7301701/75/" data-original="/image/7301701/75/" width="50" height="66">Devil of the Iron Flower</a> by <a href="/u/16153326/Just-a-guy-with-a-keyboard">Just a guy with a keyboard</a> <a class="reviews" href="/r/14357894/">reviews</a>
            <div class="z-indent z-padtop">this boy ichika Orimura was believed to have died in a kidnapping incident but he didn't but in exchange for staying with the living he was subjected to the horrors of being a child solider and fighting in a war This is an alternate version of a story made by "Azure Dragon of the East" this will be further explained in what would be the first chapter of the story<div class="z-padtop2 xgray">Crossover - Infinite Stratos/IS&lt;インフィニット・ストラトス&gt; &amp; Mobile Suit Gundam: Iron-Blooded Orphans - Rated: T - English - Sci-Fi/Romance - Chapters: 1 - Words: 216 - Reviews: 4 - Favs: 3 - Follows: 3 - Published: <span data-xutime="1716258296">May 21</span></div></div>`
        ], '', '', '')).to.eql([{
            author: {id: 16153326, name: "Just a guy with a keyboard"},
            chapters: 1,
            characters: [],
            community: null,
            completed: false,
            description: "this boy ichika Orimura was believed to have died in a kidnapping incident but he didn't but in exchange for staying with the living he was subjected to the horrors of being a child solider and fighting in a war This is an alternate version of a story made by \"Azure Dragon of the East\" this will be further explained in what would be the first chapter of the story",
            fandom: "Infinite Stratos/IS&lt;インフィニット・ストラトス&gt;",
            favs: 3,
            follows: 3,
            genreA: "Sci-Fi",
            genreB: "Romance",
            id: 14357894,
            image: "/image/7301701/75/",
            language: "English",
            pairings: [],
            published: 1716258296,
            rated: "T", 
            reviews: 4, 
            title: "Devil of the Iron Flower", 
            updated: 0, 
            words: 216, 
            xfandom: "Mobile Suit Gundam: Iron-Blooded Orphans"
        }]);
    });
});

describe('parser parseUserPage', () => {
    it ('should handle the basics', () => {
        expect(parser.parseUserPage('https://www.fanfiction.net/u/5503799/Paersephone', [
            `<span class="bff_span bff_success">up to date</span><a class="stitle" href="/s/13474353/1/Drabbles-OS-and-passing-thoughts"><img class="lazy cimage " style="clear: left; float: left; margin-right: 3px; padding: 2px; border: 1px solid rgb(204, 204, 204); border-radius: 2px; display: block;" src="/image/5920357/75/" data-original="/image/5920357/75/" width="50" height="66">Drabbles, OS, and passing thoughts</a> <a href="/s/13474353/2/Drabbles-OS-and-passing-thoughts"><span class="icon-chevron-right xicon-section-arrow"></span></a>
            <div class="z-indent z-padtop">Multiple pairings and sometimes no pairings at all. I just want to have a kind of masterfic where everything can be stored, so it doesn't get too crowded on my profile yet. All HP-related, some AU, some canon. FIRST FOR NOW : Someone Who Cares. Neville doesn't feel so well after discovering who exactly was usurpating Moody's identity.<div class="z-padtop2 xgray">Harry Potter - Rated: T - English - Chapters: 2 - Words: 1,068 - Follows: 1 - Published: <span data-xutime="1578593189">Jan 9, 2020</span> - Complete</div></div>
            `])
        ).to.eql([{
            id: 13474353,
            title: 'Drabbles, OS, and passing thoughts',
            image: "/image/5920357/75/",
            fandom: 'Harry Potter',
            author: {
                id: 5503799,
                name: "Paersephone"
            },
            xfandom: null,
            rated: 'T',
            language: 'English',
            genreA: null,
            genreB: null,
            chapters: 2,
            words: 1068,
            reviews: 0,
            favs: 0,
            follows: 1,
            updated: 0,
            published: 1578593189,
            characters: [],
            pairings: [],
            completed: true,
            description: "Multiple pairings and sometimes no pairings at all. I just want to have a kind of masterfic where everything can be stored, so it doesn't get too crowded on my profile yet. All HP-related, some AU, some canon. FIRST FOR NOW : Someone Who Cares. Neville doesn't feel so well after discovering who exactly was usurpating Moody's identity."
        }]);
    });
});
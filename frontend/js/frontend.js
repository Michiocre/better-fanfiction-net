/**
 * @import {Story, StoryParams} from "../../types.js"
 */

/**
 * 
 * @param {Array<HTMLSpanElement>} spans 
 * @param {Number} communityId 
 * @param {Boolean} forced 
 */
function sendStories(spans, communityId, forced) {
    let htmlEl = spans.map(el => el.parentElement);
    htmlEl = htmlEl.filter(el => forced || el.firstChild.classList.contains('bff-error') || el.firstChild.classList.contains('bff-warning'));

    for (let el of htmlEl) {
        el.firstChild.classList.remove('bff-error');
        el.firstChild.classList.remove('bff-success');
        el.firstChild.classList.remove('bff-warning');
        el.firstChild.classList.add('bff-loading');
        el.firstChild.innerText = 'loading';
    }

    let elements = htmlEl.map(el => utf8_to_b64(el.innerHTML));
    let communityEl = document.getElementById('gui_table1i')?.innerHTML;
    if (!communityEl) {
        communityEl = document.getElementById('gui_table1')?.innerHTML;
    }

    content.fetch(`${settings.url}/parser/page`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            url: window.location.href,
            elements,
            communityEl: communityEl? utf8_to_b64(communityEl):'',
            fandomName: document.getElementById('content_wrapper_inner')?.childNodes[5]?.data?.trim(),
            communityName: document.getElementById('content_wrapper_inner')?.childNodes[15]?.data?.trim()
            || document.getElementById('content_wrapper_inner')?.childNodes[11]?.data?.trim()
            || document.getElementById('content_wrapper_inner')?.firstChild.childNodes[15]?.data?.trim()
            || document.getElementById('content_wrapper_inner')?.firstChild.childNodes[11]?.data?.trim()
        }),
    }).then(res => res.json()).then(val => {
        updateIndicators(spans, val, communityId);
    });
}

/**
 * @param {Array<HTMLSpanElement>} spans
 * @param {Array<Story>} stories
 * @param {number} communityId
 */
function updateIndicators(spans, stories, communityId) {
    for (const span of spans) {
        if (span.classList.contains('bff-success')) {
            continue;
        }

        let story = stories.find(el => el.id === Number(span.id.split('-')[2]));

        let status = 'not_registered';
        if (story) {
            if (Number.parseInt(story.time) >= span.getAttribute('time')) {
                status = 'loaded';
            } else {
                status = 'outdated';
            }

            if (communityId && !story.communities.find(el => el.id === communityId)) {
                status = 'outdated';
            }
        }

        switch (status) {
            case 'loaded':
                span.classList.remove('bff-loading');
                span.classList.add('bff-success');
                span.innerText = 'up to date';
                break;
            case 'outdated':
                span.classList.remove('bff-loading');
                span.classList.add('bff-warning');
                span.innerText = 'outdated';
                break;
            case 'not_registered':
                span.classList.remove('bff-loading');
                span.classList.add('bff-error');
                span.innerText = 'not registered';
                break;
        }
    }
}

function handleFandomLoader() {
    let wrapper = document.getElementById('content_wrapper_inner');
    wrapper.classList.add('bff');
    let newEl = document.createElement('span');
    newEl.innerText = 'loading';
    newEl.classList.add('bff-loading');
    newEl.classList.add('bff-span');

    let categories = Array.from(document.getElementsByName('pcategoryid')[0].children).map(option => {
        return {
            id: option.value,
            name: option.innerText
        };
    }).filter(f => f.id >= 0);

    let fandoms = [];
    for (let cat of categories) {
        fandoms = fandoms.concat(Array.from(document.getElementById('cat_' + cat.id).firstChild.children).map(foption => {
            return {
                id: foption.value,
                category: cat.name,
                name: foption.title
            }
        }).filter(f => f.id >= 0));
    }

    newEl.onclick = function (el) {
        if (el.target.classList.contains('bff-warning') || el.target.classList.contains('bff-error')) {
            let list = document.getElementsByClassName('bff-span');
            newEl.classList.remove('bff-error');
            newEl.classList.remove('bff-success');
            newEl.classList.remove('bff-warning');
            newEl.classList.add('bff-loading');
            newEl.innerText = 'updating';

            content.fetch(`${settings.url}/parser/fandoms`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({elements: fandoms}),
            }).then(res => {
                if (res.status == 200) {
                    newEl.classList.remove('bff-error');
                    newEl.classList.remove('bff-warning');
                    newEl.classList.add('bff-success');
                    newEl.innerText = 'loaded';
                } else {
                    newEl.classList.remove('bff-success');
                    newEl.classList.remove('bff-warning');
                    newEl.classList.add('bff-error');
                    newEl.innerText = 'error';
                }
            });
        }
    };
    wrapper.insertBefore(newEl, wrapper.children[2]);

    content.fetch(`${settings.url}/fandoms/count`).then(res => {
        res.json().then(val => {
            val.count--;
            let status = 'not_registered';
            if (val.count === 0) {
                status = 'not_registered';
            } else if (val.count < fandoms.length) {
                status = 'outdated';
            } else if (val.count === fandoms.length) {
                status = 'loaded';
            } else if (val.count > fandoms.length) {
                status = 'outdated';
            }

            switch (status) {
                case 'loaded':
                    newEl.classList.remove('bff-loading');
                    newEl.classList.add('bff-success');
                    newEl.innerText = 'up to date';
                    break;
                case 'outdated':
                    newEl.classList.remove('bff-loading');
                    newEl.classList.add('bff-warning');
                    newEl.innerText = 'outdated';
                    break;
                case 'not_registered':
                    newEl.classList.remove('bff-loading');
                    newEl.classList.add('bff-error');
                    newEl.innerText = 'not registered';
                    break;
            }
        });
    });
    return;
}

function appendOverlay() {
    const overlay = document.createElement('div');
    overlay.innerHTML = `
    <div id="betterff-overlay" style="text-align:left;border-left: 1px solid #dddddd;" class="table-bordered bff-overlay ${settings.overlayOpen ? '' : 'closed'}">
        <button class="btn betterff-overlay-btn" id="betterff-settings-button" style="position: absolute; transform: translateX(-100%);">!</button>
        <button class="btn betterff-overlay-btn" id="betterff-search-button" style="position: absolute; transform: translateX(-100%); top: 40px;">?</button>
        <form id="betterff-settings-form" action="javascript:;">
            <div class="tcat" style="background-color: transparent !important"><span><b>Settings</b></span></div>
            <table class="table table-bordered">
                <tbody>
                    <tr>
                        <td style="border-left: none;">Backend Url</td>
                        <td><input class="span3" type="text" name="url" id="bff-backend-url" value="${settings.url}" title="BackendUrl"></td>
                    </tr>
                    <tr>
                        <td style="border-left: none;">Autoload</td>
                        <td><input onclick="" type="checkbox" name="autoLoad" value="1" ${settings.autoLoad ? 'checked' : ''}></td>
                    </tr>
                    <tr>
                        <td style="border-left: none;">Darkmode</td>
                        <td><input onclick="" type="checkbox" name="darkMode" value="1" ${settings.darkMode ? 'checked' : ''}></td>
                    </tr>
                    <tr>
                        <td style="border-left: none;">Tag Groups</td>
                        <td><textarea class="input-block-level" rows=3 name="tagGroups" id="bff-tagGroups" title="BackendUrl">${settings.tagGroups.join(', ')}</textarea></td>
                    </tr>
                </tbody>
            </table>
            <button type="submit" class="btn">Save</button>
        </form>
    </div>
    `;
    document.body.append(overlay.children[0]);
    document.getElementById('betterff-search-button').onclick = _e => {
        window.location = 'https://www.fanfiction.net/topic/241520/187482375/1/Search-Page';
    };
    document.getElementById('betterff-settings-button').onclick = _e => {
        settings.overlayOpen = !settings.overlayOpen;
        document.getElementById('betterff-overlay').classList.toggle('closed', !settings.overlayOpen);
        localStorage.setItem('betterff', JSON.stringify(settings));
    };
    document.getElementById('betterff-settings-form').onsubmit = e => {
        const formData = new FormData(e.target);
        const formProps = Object.fromEntries(formData);
        settings = formProps;
        settings.overlayOpen = false;
        settings.tagGroups = document.getElementById('bff-tagGroups').value.split(',').map(el => el.trim());
        localStorage.setItem('betterff', JSON.stringify(settings));

        location.reload();
    };
}

function loadSearchPage() {
    let urlParts = window.location.href.split('Search-Page/');
    const paramMap = ['title',
        'description',
        'datefrom',
        'dateuntil',
        'sort',
        'page',
        'limit',
    ];
    let params = {
        title: '',
        description: '',
        page: 1,
        limit: 100,
    };
    let sendRightAway = false;
    if (urlParts.length > 1) {
        let paramsList = urlParts[1].split('/').map(el => decodeURI(el));
        for (let i = 0; i < paramsList.length; i++) {
            params[paramMap[i]] = paramsList[i];
        }
        if (urlParts[1] !== '') {
            sendRightAway = true;
        }
    }
    document.getElementById('content_wrapper_inner').innerHTML = `
        <form id="bff-search-form">
            <div class="bff-form-container">
                <h3>BetterFF Search</h3>
                <div class="bff-row">
                    <label class="bff-label">Title</label>
                    <input class="bff-input" type="text" name="title" placeholder="Title" value="${params.title}"></input>
                </div>
                <div class="bff-row">
                    <label class="bff-label">Description</label>
                    <input class="bff-input" type="text" name="description" placeholder="Description" value="${params.description}"></input>
                </div>
                <div class="bff-row">
                    <label class="bff-label">Last Update after</label>
                    <input class="bff-input" type="date" id="bff-datefrom" name="datefrom" value="${params.datefrom}"></input>
                </div>
                <div class="bff-row">
                    <label class="bff-label">Last Update before</label>
                    <input class="bff-input" type="date" id="bff-dateuntil" name="dateuntil" value="${params.dateuntil}"></input>
                </div>
                <div class="bff-row">
                    <label class="bff-label">Order by</label>
                    <select class="bff-input" type="dropdown" name="sort" placeholder="Description">
                        <option value="relevance" ${params.sort === 'relevance' ? 'selected' : ''}>Relevance</option>
                        <option value="update" ${params.sort === 'update' ? 'selected' : ''}>Update Date</option>
                        <option value="publish" ${params.sort === 'publish' ? 'selected' : ''}>Publish Date</option>
                        <option value="reviews" ${params.sort === 'reviews' ? 'selected' : ''}>Reviews</option>
                        <option value="favorites" ${params.sort === 'favorites' ? 'selected' : ''}>Favorites</option>
                        <option value="follows" ${params.sort === 'follows' ? 'selected' : ''}>Follows</option>
                        <option value="words" ${params.sort === 'words' ? 'selected' : ''}>Words</option>
                    </select>
                </div>
                <button class="btn" type="button" id="bff-search-button">Search</button>
                <button class="btn" id="bff-search-button-hidden">Search</button>
            </div>
            <input type="hidden" id="bff-limit" name="limit" value="${params.limit}"></input>
            <input type="hidden" id="bff-page" name="page" value="${params.page}"></input>
        </form>

        <div>
            <center id="bff-pagination-top" class="bff-search-pagination" style="margin-top:5px;margin-bottom:5px;"></center>
            <div id="bff-search-result"></div>
            <center id="bff-pagination-bottom" class="bff-search-pagination" style="margin-top:5px;margin-bottom:5px;">
        </div>
        `;

    document.getElementById('bff-search-button').onmousedown = (event) => {
        event.preventDefault();
        document.getElementById('bff-page').value = 1;
        searchStories(paramMap);
    };

    document.getElementById('bff-search-button-hidden').onclick = (event) => {
        event.preventDefault();
        searchStories(paramMap);
    };

    if (sendRightAway) {
        searchStories(paramMap);
    }
}

function searchStories(paramMap) {
    let formData = new FormData(document.getElementById('bff-search-form'));
    let searchString = '';

    let postObject = {};
    paramMap.forEach(key => {
        let value = formData.get(key);
        searchString += `${encodeURI(value)}/`;
        postObject[key] = value;
    });

    content.fetch(`${settings.url}/stories`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(postObject),
    }).then(async res => {
        if (res.body) {
            return res.json();
        }
        return [];
    }).then(val => {
        window.history.pushState(val, '', `${origin}/topic/241520/187482375/1/Search-Page/${searchString}`);
        renderSearchResult(val);
    });
}

window.addEventListener('popstate', (event) => {
    if (event.state) {
        renderSearchResult(event.state);
    }
});

function renderSearchResult(val) {
    if (val.error) {
        document.getElementById('bff-search-result').innerHTML = `
            <div class="panel">
                <span class="gui_error">
                    ${val.error}
                    ${JSON.stringify(val.details)}
                </span>
            </div>`;
        return;
    }

    if (val.count === 0) {
        document.getElementById('bff-search-result').innerHTML = `
            <div class="panel">
                <span class="gui_normal">
                    No result found matching your search.
                </span>
            </div>`;
        return;
    }

    document.getElementById('bff-search-result').innerHTML =
        `<hr size="1" noshade="">`;

    const maxPages = Math.ceil(val.total / val.limit);

    let paginationString = `${niceNumber(val.total, true)} | `;
    if (val.page >= 2) {
        paginationString += `<a onclick=document.getElementById('bff-page').value=${Number(val.page) - 1};document.getElementById('bff-search-button-hidden').click()>« Prev</a> `;
    }
    paginationString += 'Page ';
    if (val.page >= 2) {
        paginationString += `<a onclick=document.getElementById('bff-page').value=1;document.getElementById('bff-search-button-hidden').click()>1</a> `;
    }
    if (val.page >= 3) {
        paginationString += '.. ';
    }
    if (val.page >= 12) {
        paginationString += `<a onclick=document.getElementById('bff-page').value=${Number(val.page) - 10};document.getElementById('bff-search-button-hidden').click()>${Number(val.page) - 10}</a> `;
    }
    for (let i = val.page - 3; i <= Number(val.page) + 3; i++) {
        if (i >= 2 && i !== val.page && i < maxPages) {
            paginationString += `<a onclick=document.getElementById('bff-page').value=${i};document.getElementById('bff-search-button-hidden').click()>${i}</a> `;
        }
        if (i === val.page) {
            paginationString += `<b>${val.page}</b> `;
        }

        if (i === maxPages && i - 1 === val.page) {
            paginationString += `<a onclick=document.getElementById('bff-page').value=${i};document.getElementById('bff-search-button-hidden').click()>${i}</a> `;
        }
    }

    if (val.page < maxPages - 10) {
        paginationString += `<a onclick=document.getElementById('bff-page').value=${Number(val.page) + 10};document.getElementById('bff-search-button-hidden').click()>${Number(val.page) + 10}</a> `;
    }
    if (val.page < maxPages - 1) {
        paginationString += `.. <a onclick=document.getElementById('bff-page').value=${maxPages};document.getElementById('bff-search-button-hidden').click()>Last</a> `;
    }
    if (val.page < maxPages) {
        paginationString += `<a onclick=document.getElementById('bff-page').value=${Number(val.page) + 1};document.getElementById('bff-search-button-hidden').click()>Next »</a> `;
    }

    document.getElementsByClassName('bff-search-pagination')[0].innerHTML = paginationString;

    if (val.count < 10) {
        document.getElementById('bff-pagination-bottom').hidden = true;
    }
    document.getElementById('bff-pagination-bottom').innerHTML = paginationString;

    val.stories.forEach((story) => document.getElementById('bff-search-result').appendChild(createStory(story)));
}

/**
 * @param {Story} data
 * @returns {HTMLDivElement}
 */
function createStory(data) {
    let story = document.createElement('div');

    let parts = [];
    if (!data.xfandom) {
        parts.push(data.fandom);
    } else {
        parts.push('Crossover');
        parts.push([data.fandom, data.xfandom].join(' & '));
    }
    parts.push(`Rated: ${data.rating}`);
    parts.push(data.language);
    data.genreA && !data.genreB && parts.push(data.genreA);
    data.genreA && data.genreB && parts.push([data.genreA, data.genreB].join('/'));
    parts.push(`Chapters: ${niceNumber(data.chapters)}`);
    parts.push(`Words: ${niceNumber(data.words)}`);
    data.reviews > 0 && parts.push(`Reviews: ${niceNumber(data.reviews)}`);
    data.favs > 0 && parts.push(`Favs: ${niceNumber(data.favs)}`);
    data.follows > 0 && parts.push(`Follows: ${niceNumber(data.follows)}`);
    data.updated > 0 && parts.push(`Updated: <span data-xutime="${data.updated}">${unixToReadable(data.updated)}</span>`);
    parts.push(`Published: <span data-xutime="${data.published}">${unixToReadable(data.published)}</span>`);
    (data.pairings.length > 0 || data.characters.length > 0) && parts.push(`${data.pairings.map(pair => `[${pair.join(', ')}]`).join(' ')} ${data.characters.join(', ')}`);
    data.completed && parts.push(`Complete`);

    story.innerHTML = `
        <div class="z-list zhover zpointer" style="min-height:77px;border-bottom:1px #cdcdcd solid;">
            <a class="stitle" href="/s/${data.id}">
                <img class="lazy cimage" style="clear: left; float: left; margin-right: 3px; padding: 2px; border: 1px solid rgb(204, 204, 204); border-radius: 2px; display: block;" 
                    src="${data.image_id ? `/image/${data.image_id}/75/` : '/static/images/d_60_90.jpg'}" width="50" height="66">
                ${data.title}
            </a>
            ${data.chapters > 1 ? `<a href="/s/${data.id}/${data.chapters}"><span class="icon-chevron-right xicon-section-arrow"></span></a>` : ''}
            by <a href="/u/${data.author_id}">${data.author_name}</a>  ${data.reviews > 0 ? `<a class="reviews" href="/r/${data.id}/">reviews</a>` : ''}
            <div class="z-indent z-padtop">${data.description}
                <div class="z-padtop2 xgray">
                    ${parts.join(' - ')}
                </div>
            </div>
        </div>
    `;

    return story;
}

let main = function() {
    if (window.location.pathname.startsWith('/selectcategory.php')) {
        return handleFandomLoader();
    }

    appendOverlay();

    if (window.location.pathname.startsWith('/topic/241520/187482375/1/Search-Page')) {
        return loadSearchPage();
    }

    if (window.location.pathname.startsWith('/forums')) {
        return;
    }

    let communityId = null;
    if (window.location.pathname.startsWith('/community')) {
        communityId = parseInt(window.location.pathname.split('/')[3]);
    }

    let storiesEl = document.getElementsByClassName('z-list');

    if (storiesEl.length === 0) {
        return;
    }

    let adBlock = storiesEl[0].previousElementSibling;
    if (adBlock) {
        adBlock.hidden = true;
    }

    let storyIds = [];
    let spans = [];

    for (let storyEl of storiesEl) {
        let elementExists = storyEl.firstChild.id.startsWith('bff-span-');

        let id, spanEl;

        if (elementExists) {
            id = storyEl.firstChild.id;
            spanEl = storyEl.firstChild;
        } else {
            storyEl.classList.add('bff');
            
            id = storyEl.firstChild.href.split('/')[4];
            spanEl = document.createElement('span');
            
            spanEl.id = `bff-span-${id}`;
            spanEl.innerText = 'loading';
            spanEl.classList.add('bff-loading');
            spanEl.classList.add('bff-span');
            spanEl.setAttribute('time', storyEl.lastChild.lastChild.getElementsByTagName('span')[0].getAttribute('data-xutime'));
            spanEl.onclick = event => {
                if (event.ctrlKey) {
                    sendStories([spanEl], communityId, true);
                } else if (event.target.classList.contains('bff-warning') ||event.target.classList.contains('bff-error')) {
                    sendStories(spans, communityId, false);
                }
            };
            storyEl.insertBefore(spanEl, storyEl.firstChild);
        }
        
        storyIds.push(id);
        spans.push(spanEl);
    }

    content.fetch(`${settings.url}/stories/status`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ids: storyIds })
    }).then(async res => {
        if (res.body) {
            return res.json();
        }
        return [];
    }).then(val => {
        updateIndicators(spans, val, communityId);
        if (settings.autoLoad) {
            let redEl = document.getElementsByClassName('bff-error');
            let yellowEl = document.getElementsByClassName('bff-error');
            if (redEl.length > 0) {
                redEl[0].click();
            } else if (yellowEl.length > 0) {
                yellowEl[0].click();
            }
        }
    });
}();

/**
 * @param {number} num
 * @return {String}
 */
function niceNumber(num, shorten) {
    if (shorten && num >= 1000) {
        let thousands = (num / 1000);
        let roundedNumber  = thousands.toFixed(thousands < 100 ? 1 : 0);

        if (thousands >= 1000) {
            let millions = (thousands / 1000)
            roundedNumber = millions.toFixed(millions < 100 ? 1 : 0);
            return `${new Intl.NumberFormat('en-US').format(roundedNumber)}M`;
        }
        return `${new Intl.NumberFormat('en-US').format(roundedNumber)}K`;
    }
    return new Intl.NumberFormat('en-US').format(num);
}

/**
 * @param {Number} unixTime
 * @return {String}
 */
function unixToReadable(unixTime) {
    let d = new Date(unixTime * 1000);
    let now = new Date();
    let diff = new Date(now - d);

    let minutesAgo = Math.floor(diff / 1000 / 60);
    let hoursAgo = Math.floor(minutesAgo / 60);

    if (minutesAgo < 60) {
        return `${minutesAgo}m ago`;
    }

    if (hoursAgo < 24) {
        return `${hoursAgo}h ago`;
    }

    if (d.getFullYear() === now.getFullYear()) {
        return d.toLocaleString('en-us', { month: 'short', day: 'numeric'});
    }

    return d.toLocaleString('en-us', { month: 'short', day: 'numeric', year: 'numeric'});
}

/**
 * Converts utf8 string into base 64
 * @param {string} str
 * @return {String}
 */
function utf8_to_b64(str) {
    return window.btoa(unescape(encodeURIComponent(str)));
}

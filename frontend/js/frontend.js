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

    content.fetch(`${settings.backendUrl}/parser/page`, {
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

function handleFandomPage() {
    let wrapper = document.getElementById('content_wrapper_inner');
    wrapper.classList.add('bff');

    let newEl = createElement('span', ['bff-loading', 'bff-span'], 'loading');

    let categories = Array.from(document.getElementsByName('pcategoryid')[0].children).map(option => {
        return {
            id: option.value,
            name: option.innerText
        };
    }).filter(f => f.id >= 0);

    let fandoms = [];
    for (let cat of categories) {
        fandoms = fandoms.concat(Array.from(document.getElementById(`cat_${cat.id}`).firstChild.children).map(foption => {
            return {
                id: foption.value,
                category: cat.name,
                name: foption.title
            }
        }).filter(f => f.id >= 0));
    }

    newEl.onclick = (el) => {
        if (el.target.classList.contains('bff-warning') || el.target.classList.contains('bff-error')) {
            newEl.classList.remove('bff-error', 'bff-success', 'bff-warning');
            newEl.classList.add('bff-loading');
            newEl.textContent = 'updating';

            content.fetch(`${settings.backendUrl}/parser/fandoms`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({elements: fandoms}),
            }).then(res => {
                newEl.classList.remove('bff-loading');
                if (res.status === 200) {
                    newEl.classList.remove('bff-error', 'bff-warning');
                    newEl.classList.add('bff-success');
                    newEl.textContent = 'loaded';
                } else {
                    newEl.classList.remove('bff-success', 'bff-warning');
                    newEl.classList.add('bff-error');
                    newEl.textContent = 'error';
                }
            });
        }
    };
    wrapper.insertBefore(newEl, wrapper.children[2]);

    content.fetch(`${settings.backendUrl}/fandoms/count`).then(res => {
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
    let oldOverlay = document.getElementById('betterff-overlay');
    if (oldOverlay) {
        document.body.removeChild(oldOverlay);
    }

    let overlay = createOverlay(settings);

    document.body.append(overlay);
    document.getElementById('betterff-search-button').onclick = _e => {
        window.location = 'https://www.fanfiction.net/topic/241520/187482375/1/Search-Page';
    };
    document.getElementById('betterff-settings-button').onclick = _e => {
        settings.overlayOpen = !settings.overlayOpen;
        document.getElementById('betterff-overlay').classList.toggle('closed', !settings.overlayOpen);
        localStorage.setItem('betterff-settings', JSON.stringify(settings));
    };
    document.getElementById('betterff-settings-form').onsubmit = e => {
        const formData = new FormData(e.target);
        const formProps = Object.fromEntries(formData);
        settings = formProps;
        settings.overlayOpen = false;
        settings.tagGroups = formProps.tagGroups.split(',').map(el => el.trim());
        localStorage.setItem('betterff-settings', JSON.stringify(settings));

        location.reload();
    };
}

async function handleSearchPage() {
    let urlParts = window.location.href.split('Search-Page/');

    let fandomList = await (await content.fetch(`${settings.backendUrl}/fandoms`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
        }
    })).json() ?? [];

    let params = {
        title: '',
        description: '',
        fandom: '',
        datefrom: '',
        dateuntil: '',
        sort: 'relevance',
        page: 1,
        limit: 100,
    };

    let sendRightAway = false;
    if (urlParts.length > 1) {
        let urlParams = urlParts[1].split('/').map(el => decodeURI(el));
        for (let i = 0; i < urlParams.length; i++) {
            params[Object.keys(params)[i]] = urlParams[i];
        }
        delete params.undefined;
        if (urlParts[1] !== '') {
            sendRightAway = true;
        }
    }

    let searchOptions = [
        { value: 'relevance', name: 'Relevance', selected: false },
        { value: 'update', name: 'Update Date', selected: false },
        { value: 'publish', name: 'Publish Date', selected: false },
        { value: 'reviews', name: 'Reviews', selected: false },
        { value: 'favorites', name: 'Favorites', selected: false },
        { value: 'follows', name: 'Follows', selected: false },
        { value: 'words', name: 'Words', selected: false },
    ];

    (searchOptions.find(el => el.value === params.sort) ?? searchOptions[0]).selected = true;

    let searchForm = createSearchForm(params, fandomList, searchOptions);

    let paginationWrapper = createElement('div', null, 
        wrapper => wrapper.append(
            createElement('center', 'bff-search-pagination', 
                pag => pag.style = 'margin-top:5px;margin-bottom:5px;'
            ),
            createElement('div', null, 
                results => results.id = 'bff-search-result'
            ),
            createElement('center', 'bff-search-pagination', 
                pag => pag.style = 'margin-top:5px;margin-bottom:5px;'
            )
        )
    );

    document.getElementById('content_wrapper_inner').textContent = '';
    document.getElementById('content_wrapper_inner').append(
        searchForm,
        paginationWrapper
    );

    document.getElementById('bff-fandom-input').oninput = event => {        
        if (event.target.value == '' || fandomList.find(el => el.name == event.target.value)) {
            event.target.setCustomValidity('');
        } else {
            event.target.setCustomValidity('Fandom name has to match existing fandom');
        }
    };

    let searchPageOne = (event) => {
        event.preventDefault();
        document.getElementById('bff-page').value = 1;
        searchStories(params);
    };
    searchForm.onsubmit = searchPageOne;
    document.getElementById('bff-search-button').onmousedown = searchPageOne;

    document.getElementById('bff-search-button-hidden').onclick = event => {
        event.preventDefault();
        searchStories(params);
    };

    if (sendRightAway) {
        searchStories(params);
    }
}

function searchStories(params) {
    let formData = new FormData(document.getElementById('bff-search-form'));
    let searchString = '';

    let postObject = {};
    Object.keys(params).forEach(key => {
        let value = formData.get(key);
        searchString += `${encodeURI(value)}/`;
        postObject[key] = value;
    });

    content.fetch(`${settings.backendUrl}/stories`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(postObject),
    }).then(res => res.json()).then(body => {
        window.history.pushState(body, '', `${origin}/topic/241520/187482375/1/Search-Page/${searchString}`);
        renderSearchResult(body);
    });
}

window.addEventListener('popstate', (event) => {
    if (event.state) {
        renderSearchResult(event.state);
    }
});

function renderSearchResult(val) {
    let resultElement = document.getElementById('bff-search-result');
    resultElement.textContent = '';

    if (val.error || val.count === 0) {
        let panel = createElement('div', 'panel', 
            createElement('span', 'gui_error', 
                val.error ? `${val.error} ${JSON.stringify(val.details)}` : 'No result found matching your search.'
            )
        );
        resultElement.appendChild(panel);
        return;
    }

    resultElement.appendChild(document.createElement('hr'));

    let paginationSpan = createPagination(Number(val.total), Number(val.limit), Number(val.page));

    let paginations = document.getElementsByClassName('bff-search-pagination');

    paginations[0].textContent = '';
    paginations[1].textContent = '';

    paginations[0].appendChild(paginationSpan);
    paginations[1].appendChild(paginationSpan.cloneNode(true));
    paginations[1].hidden = val.count < 10;

    val.stories.forEach((story) => document.getElementById('bff-search-result').appendChild(createStory(story)));
}

function main() {
    if (window.location.pathname.startsWith('/selectcategory.php')) {
        return handleFandomPage();
    }

    appendOverlay();

    if (window.location.pathname.startsWith('/topic/241520/187482375/1/Search-Page')) {
        return handleSearchPage();
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
        storyEl.classList.add('bff');

        if (storyEl.firstChild.id.startsWith('bff-span-')) {
            storyIds.push(storyEl.firstChild.id);
            spans.push(storyEl.firstChild);
            continue;
        }

        let id = storyEl.firstChild.href.split('/')[4];

        let spanEl = createElement('span', ['bff-loading', 'bff-span'],
            el => el.id = `bff-span-${id}`,
            el => el.setAttribute('time', storyEl.lastChild.lastChild.getElementsByTagName('span')[0].getAttribute('data-xutime')),
            el => el.onclick = event => {
                if (event.ctrlKey) {
                    sendStories([spanEl], communityId, true);
                } else if (event.target.classList.contains('bff-warning') ||event.target.classList.contains('bff-error')) {
                    sendStories(spans, communityId, false);
                }
            },
            'loading'
        );

        storyEl.insertBefore(spanEl, storyEl.firstChild);
        
        storyIds.push(id);
        spans.push(spanEl);
    }

    content.fetch(`${settings.backendUrl}/stories/status`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ids: storyIds })
    }).then(async res => {
            return res.body ? res.json() : [];
    }).then(val => {
        updateIndicators(spans, val, communityId);

        if (settings.autoLoad) {
            let redEl = document.getElementsByClassName('bff-error');
            let yellowEl = document.getElementsByClassName('bff-warning');
            if (redEl.length > 0) {
                redEl[0].click();
            } else if (yellowEl.length > 0) {
                yellowEl[0].click();
            }
        }
    });
}

/**
 * Converts a number in to a short readable string (1000 => 1.0k)
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
 * Converts unix Time into a nice formated string
 * => 10min ago
 * => 16 May
 * => 15 March 2017
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

main();
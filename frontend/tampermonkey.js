// ==UserScript==
// @name         Better fanfiction.net
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  try to take over the world!
// @author       Michiocre
// @match        https://www.fanfiction.net/*
// @icon         data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==
// @grant        GM_addStyle
// @grant        GM_xmlhttpRequest
// ==/UserScript==

function utf8_to_b64( str ) {
    return window.btoa(unescape(encodeURIComponent( str )));
}

(function() {
    'use strict';

    GM_addStyle(`
        .bff {
            position: relative;
        }
        .bff > span {
            cursor: pointer;
            margin-right: 10px;
            content: "";
            float: right;
            max-width: 10px;
            height: 15px;
            border-radius: 15px;
            padding: 3px 5px 2px 5px;
            font-size: smaller;
            color: transparent;
            transition: max-width 0.2s, color 0.2s;
            overflow: hidden;
        }
        .bff > span:hover {
            max-width: 100px;
            color: white;
        }
        .bff_loading {
            background: lightgray;
        }
        .bff_success {
            background: lightgreen;
        }
        .bff_warning {
            background: sandybrown;
        }
        .bff_error {
            background: lightcoral;
        }
        .adsbygoogle {
            display: none !important;
        }
    `);

    if (window.location.pathname.startsWith('/selectcategory.php')) {
        handleFandomLoader();
        return;
    }

    let communityId = null;
    if (window.location.pathname.startsWith('/community')) {
        communityId = parseInt(window.location.pathname.split('/')[3]);
    }

    let storiesEl = document.getElementsByClassName('z-list');

    if (storiesEl.length == 0) {
        return;
    }

    let adBlock = storiesEl[0].previousElementSibling;
    if (adBlock) {
        adBlock.hidden = true;
    }

    let storyIds = [];
    let spans = [];

    for (let storyEl of storiesEl) {
        let id = storyEl.firstChild.href.split('/')[4];
        storyIds.push(id);

        storyEl.classList.add('bff');
        let newEl = document.createElement("span");
        newEl.id = 'bff_span_' + id;
        newEl.innerText = "loading";
        newEl.classList.add('bff_loading');
        newEl.classList.add('bff_span');
        newEl.setAttribute('time', storyEl.lastChild.lastChild.getElementsByTagName('span')[0].getAttribute('data-xutime') * 1000);
        newEl.onclick = function (el) {
            if (el.target.classList.contains('bff_warning') || el.target.classList.contains('bff_error')) {
                let list = document.getElementsByClassName('bff_span');
                for (let i of list) {
                    i.classList.remove('bff_error');
                    i.classList.remove('bff_success');
                    i.classList.remove('bff_warning');
                    i.classList.add('bff_loading');
                    i.innerText = 'loading';
                }

                let htmlEl = Array.from(document.getElementsByClassName('z-list'));
                let elements = htmlEl.map(el => utf8_to_b64(el.innerHTML));
                let communityEl = document.getElementById('gui_table1i')?.innerHTML;
                fetch('http://localhost:8888/parser/page', {
                    method: "POST",
                    headers: {
                      "Content-Type": "application/json",
                    },
                    body: JSON.stringify({url: window.location.href, elements, communityEl: communityEl? utf8_to_b64(communityEl):'', fandomName: document.getElementById('content_wrapper_inner')?.childNodes[5].data?.trim()}),
                }).then(res => res.json()).then(val => {
                    console.log(val);
                    updateIndicators(spans, val, communityId);
                });
            }
        }
        storyEl.insertBefore(newEl, storyEl.firstChild);
        spans.push(newEl);
    }

    fetch(`http://localhost:8888/stories/status`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ids: storyIds})
    }).then(res => res.json()).then(val => {
        updateIndicators(spans, val, communityId);
    });
})();

function updateIndicators(spans, stories, communityId) {
    for (const span of spans) {
        let story = stories.find(el => el.id == span.id.split('_')[2]);

        let status = 'not_registered';
        if (story) {
            if (new Date(story.time).getTime() >= span.getAttribute('time')) {
                status = 'loaded'
            } else {
                status = 'outdated'
            }

            if (communityId && !story.communities.includes(communityId)) {
                status = 'outdated';
            }
        }

        switch (status) {
            case 'loaded':
                span.classList.remove('bff_loading');
                span.classList.add('bff_success');
                span.innerText = 'up to date';
                break;
            case 'outdated':
                span.classList.remove('bff_loading');
                span.classList.add('bff_warning');
                span.innerText = 'outdated';
                break;
            case 'not_registered':
                span.classList.remove('bff_loading');
                span.classList.add('bff_error');
                span.innerText = 'not registered';
                break;
        }
    }
}

function handleFandomLoader() {
    let wrapper = document.getElementById('content_wrapper_inner');
    wrapper.classList.add('bff');
    let newEl = document.createElement("span");
    newEl.innerText = "loading";
    newEl.classList.add('bff_loading');
    newEl.classList.add('bff_span');

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
        if (el.target.classList.contains('bff_warning') || el.target.classList.contains('bff_error')) {
            let list = document.getElementsByClassName('bff_span');
            newEl.classList.remove('bff_error');
            newEl.classList.remove('bff_success');
            newEl.classList.remove('bff_warning');
            newEl.classList.add('bff_loading');
            newEl.innerText = 'updating';

            fetch('http://localhost:8888/parser/fandoms', {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({elements: fandoms}),
            }).then(res => {
                if (res.status == 200) {
                    newEl.classList.remove('bff_error');
                    newEl.classList.remove('bff_warning');
                    newEl.classList.add('bff_success');
                    newEl.innerText = 'loaded';
                } else {
                    newEl.classList.remove('bff_success');
                    newEl.classList.remove('bff_warning');
                    newEl.classList.add('bff_error');
                    newEl.innerText = 'error';
                }
            });
        }
    }
    wrapper.insertBefore(newEl, wrapper.children[2]);

    fetch(`http://localhost:8888/fandoms/count`).then(res => {
        res.json().then(val => {
            val.count--;
            let status = 'not_registered';
            if (val.count == 0) {
                status = 'not_registered';
            } else if (val.count < fandoms.length) {
                status = 'outdated';
            } else if (val.count == fandoms.length) {
                status = 'loaded';
            }

            switch (status) {
                case 'loaded':
                    newEl.classList.remove('bff_loading');
                    newEl.classList.add('bff_success');
                    newEl.innerText = 'up to date';
                    break;
                case 'outdated':
                    newEl.classList.remove('bff_loading');
                    newEl.classList.add('bff_warning');
                    newEl.innerText = 'outdated';
                    break;
                case 'not_registered':
                    newEl.classList.remove('bff_loading');
                    newEl.classList.add('bff_error');
                    newEl.innerText = 'not registered';
                    break;
            }
        });
    });
    return;
}
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

let settings = {
    autoLoad: false,
    url: 'http://localhost:8888',
    overlayOpen: false,
    darkMode: false
};

(function() {
    'use strict';

    const loadedSettings = localStorage.getItem("betterff");
    if (loadedSettings && false) {
        settings = JSON.parse(loadedSettings);
        console.log("Loaded Settings from storage");
    } else {
        localStorage.setItem("betterff", JSON.stringify(settings));
        console.log("Used Default Settings");
    }

    appendCss();
    if (settings.darkMode) {
        appendDarkMode();
    }

    if (window.location.pathname.startsWith('/selectcategory.php')) {
        handleFandomLoader();
        return;
    }

    //appendOverlay()

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
                sendStories(spans, communityId);
            }
        }
        storyEl.insertBefore(newEl, storyEl.firstChild);
        spans.push(newEl);
    }

    fetch(`${settings.url}/stories/status`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ids: storyIds})
    }).then(res => res.json()).then(val => {
        updateIndicators(spans, val, communityId);
    });
})();

function sendStories(spans, communityId) {
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

    fetch(`${settings.url}/parser/page`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
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

            if (communityId && !story.communities.find(el => el.id == communityId)) {
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

            fetch(`${settings.url}/parser/fandoms`, {
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

    fetch(`${settings.url}/fandoms/count`).then(res => {
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

function appendCss() {
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

        .bff_overlay {
            background: white;
            position: absolute;
            top: 100px;
            right: 0px;
            width: 200px;
            height: 200px;
            z-index: 1000;
        }
    `);
}

function appendDarkMode() {
    GM_addStyle(`
        body {
            color: #e6edf3 !important;
        }

        body, .tcat, .btn {
            background-color: #0d1117 !important;
        }

        .btn {
            background-image: linear-gradient(to bottom,#010409,#0d1117);
            color: #e6edf3 !important;
            border: 1px solid #242a30 !important;
            text-shadow: none !important;
        }

        a {
            color: #4493f8 !important;
        }

        #name_login > a {
            color: orange !important;
        }

        .caret {border-top-color: #e6edf3 !important;}

        .menulink, .menulink > a {
            color: #e6edf3 !important;
        }

        .dropdown-menu > li > a:hover {color: #e6edf3 !important;}

        #content_wrapper, .zmenu, .dropdown-menu, .dropdown-menu .divider, textarea, input, .lc, .lc-wrapper::after, .z-list, hr, img, select, .modal, .modal-footer   {
            background-color: #010409 !important;
            border-color: #242a30 !important;
            box-shadow: none !important;
        }

        hr {
            background: #242a30 !important;
        }

        #content_wrapper_inner, .tcat, .table-bordered {
            border-color: #242a30 !important;
        }

        div > .zhover:hover {
            background-image: linear-gradient(to bottom,#0d1117,#010409) !important;
        }
    `);
}

function appendOverlay() {
    let overlay = document.createElement("div");
    overlay.innerHTML = `
    <div class="bff_overlay">
        WHAT IS GOING ON
    </div>
    `;
    document.body.append(overlay.children[0]);
}
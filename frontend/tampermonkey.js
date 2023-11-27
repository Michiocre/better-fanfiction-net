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

    let storiesEl = document.getElementsByClassName('z-list');

    let adBlock = storiesEl[0].previousElementSibling;
    if (adBlock) {
        adBlock.hidden = true;
    }

    if (window.location.pathname.startsWith('/communities') || window.location.pathname.startsWith('/forums')) {
        return;
    }

    let communityId = null;

    if (window.location.pathname.startsWith('/community')) {
        communityId = parseInt(window.location.pathname.split('/')[3]);
    }

    for (let storyEl of storiesEl) {
        let id = storyEl.firstChild.href.split('/')[4];
        storyEl.classList.add('bff');
        let newEl = document.createElement("span");
        newEl.innerText = "loading";
        newEl.classList.add('bff_loading');
        newEl.classList.add('bff_span');
        newEl.onclick = function (el) {
            if (el.target.classList.contains('bff_warning') || el.target.classList.contains('bff_error')) {
                let list = document.getElementsByClassName('bff_span');
                for (let i of list) {
                    i.classList.remove('bff_error');
                    i.classList.remove('bff_warning');
                    i.classList.add('bff_success');
                    i.innerText = 'up to date';
                }
                fetch(`http://localhost:8888/crawler` + window.location.pathname + window.location.search);
            }
        }
        storyEl.insertBefore(newEl, storyEl.firstChild);

        fetch(`http://localhost:8888/story/${id}/updated`).then(res => {
            res.json().then(val => {
                let status = 'not_registered';
                if (val.id) {
                    if (new Date(val.time).getTime() >= storyEl.lastChild.lastChild.getElementsByTagName('span')[0].getAttribute('data-xutime') * 1000) {
                        status = 'loaded'
                    } else {
                        status = 'outdated'
                    }

                    if (!val.communities.includes(communityId)) {
                        status = 'outdated';
                    }
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
    }
})();
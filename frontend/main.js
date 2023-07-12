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
// @require      file://C:\Users\BlankM\VSC\better-fanfiction-net\frontend\main.js
// @require      https://www.example.com/some/js/GM_fetch.js
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
            background: black;
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
        .bff_loading > span {
            background: lightgray;
        }
        .bff_success > span {
            background: lightgreen;
        }
        .bff_warning > span {
            background: sandybrown;
        }
        .bff_error > span {
            background: lightcoral;
        }
    `);

    let storiesEl = document.getElementsByClassName('z-list');

    let ads = document.getElementsByClassName('adsbygoogle');
    for (const ad of ads) {
        ad.parentElement.hidden = true;
    }

    for (let storyEl of storiesEl) {
        let id = storyEl.firstChild.href.split('/')[4];
        storyEl.classList.add('bff', 'bff_loading');
        let newEl = document.createElement("span");
        newEl.innerText = "loading";
        newEl.onclick = function () {
            fetch(`http://localhost:8888/crawler` + window.location.pathname);
        }
        storyEl.insertBefore(newEl, storyEl.firstChild);

        fetch(`http://localhost:8888/story/${id}/updated`).then(res => {
            res.json().then(val => {
                if (val.id) {
                    if (new Date(val.time).getTime() >= storyEl.lastChild.lastChild.getElementsByTagName('span')[0].getAttribute('data-xutime') * 1000) {
                        storyEl.classList.remove('bff_loading');
                        storyEl.classList.add('bff_success');
                        newEl.innerText = 'up to date';
                    } else {
                        storyEl.classList.remove('bff_loading');
                        storyEl.classList.add('bff_warning');
                        newEl.innerText = 'outdated';
                    }
                } else {
                    storyEl.classList.remove('bff_loading');
                    storyEl.classList.add('bff_error');
                    newEl.innerText = 'not registered';
                }
            });
        });
    }
})();
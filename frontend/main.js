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
           content: "";
           background: black;
           float: right;
           max-width: 12px;
           height: 15px;
           border-radius: 15px;
           padding: 3px 5px;
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
           background: gray;
        }
    `);

    let storiesEl = document.getElementsByClassName('z-list');

    for (let storyEl of storiesEl) {
        let id = storyEl.firstChild.href.split('/')[4];
        storyEl.classList.add('bff', 'bff_loading')
        let newEl = document.createElement("span");
        newEl.innerText = "loading";
        storyEl.insertBefore(newEl, storyEl.firstChild);

        fetch('localhost:8888/story/' + id + '/status').then(res => {
            console.log(res);
        });
    }
})();
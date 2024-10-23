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
    if (loadedSettings) {
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

    appendOverlay()

    if (window.location.pathname.startsWith('/forums')) {
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
        newEl.setAttribute('time', storyEl.lastChild.lastChild.getElementsByTagName('span')[0].getAttribute('data-xutime'));
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
        if (settings.autoLoad) {
            let els = document.getElementsByClassName('bff_error');
            if (els.length > 0) {
                els[0].click();
            } else {
                document.getElementsByClassName('bff_warning')[0].click();
            }
        }
    });
})();

function sendStories(spans, communityId) {
    let htmlEl = Array.from(document.getElementsByClassName('z-list'));
    htmlEl = htmlEl.filter(el => el.firstChild.classList.contains('bff_error') || el.firstChild.classList.contains('bff_warning'));

    for (let el of htmlEl) {
        el.firstChild.classList.remove('bff_error');
        el.firstChild.classList.remove('bff_success');
        el.firstChild.classList.remove('bff_warning');
        el.firstChild.classList.add('bff_loading');
        el.firstChild.innerText = 'loading';
    }

    let elements = htmlEl.map(el => utf8_to_b64(el.innerHTML));
    let communityEl = document.getElementById('gui_table1i')?.innerHTML;
    if (!communityEl) {
        communityEl = document.getElementById('gui_table1')?.innerHTML;
    }

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
        if (span.classList.contains('bff_success')) {
            continue;
        }

        let story = stories.find(el => el.id == span.id.split('_')[2]);

        let status = 'not_registered';
        if (story) {
            if (Number.parseInt(story.time)>= span.getAttribute('time')) {
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
        html {
            overflow-x: hidden;
        }
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
            z-index: 1000;
        }

        .bff_overlay.closed {
            transform: translateX(100%);
        }
    `);
}

function appendDarkMode() {
    GM_addStyle(`
        body, select, textarea, input {
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

        #content_wrapper, .zmenu, .dropdown-menu, .dropdown-menu .divider, textarea, input, .lc, .lc-wrapper::after, .z-list, hr, img, select, .modal, .modal-footer, .bff_overlay   {
            background-color: #010409 !important;
            border-color: #242a30 !important;
            box-shadow: none !important;
        }

        hr {
            background: #242a30 !important;
        }

        #content_wrapper_inner, .tcat, .table-bordered, td {
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
    <div id="betterff-overlay" style="text-align:left;border-left: 1px solid #dddddd;" class="table-bordered bff_overlay ${settings.overlayOpen?'':'closed'}">
        <button class="btn" id="betterff-settings-button" style="position: absolute; transform: translateX(-100%);">!</button>
        <form id="betterff-settings-form" action="javascript:;">
            <div class="tcat" style="background-color: transparent !important"><span><b>Settings</b></span></div>
            <table class="table table-bordered">
                <tbody>
                    <tr>
                        <td style="border-left: none;">Backend Url</td>
                        <td><input class="span2" name="url" id="backend-url" type="text" value="${settings.url}" title="BackendUrl"></td>
                    </tr>
                    <tr>
                        <td style="border-left: none;">Autoload</td>
                        <td><input onclick="" type="checkbox" name="autoLoad" value="1" ${settings.autoLoad?'checked':''}></td>
                    </tr>
                    <tr>
                        <td style="border-left: none;">Darkmode</td>
                        <td><input onclick="" type="checkbox" name="darkMode" value="1" ${settings.darkMode?'checked':''}></td>
                    </tr>
                </tbody>
            </table>
            <button type="submit" class="btn">Save</button>
        </form>
    </div>
    `;
    document.body.append(overlay.children[0]);
    document.getElementById('betterff-settings-button').onclick = e => {
        settings.overlayOpen = !settings.overlayOpen;
        document.getElementById('betterff-overlay').classList.toggle('closed', !settings.overlayOpen);
        localStorage.setItem("betterff", JSON.stringify(settings));
    };
    document.getElementById('betterff-settings-form').onsubmit = e => {
        const formData = new FormData(e.target);
        const formProps = Object.fromEntries(formData);
        settings = formProps
        settings.overlayOpen = false;
        localStorage.setItem("betterff", JSON.stringify(settings));

        location.reload();
    };
}
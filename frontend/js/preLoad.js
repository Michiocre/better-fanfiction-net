let defaultSettings = {
    autoLoad: false,
    url: 'http://localhost:8888',
    overlayOpen: false,
    darkMode: false,
    tagGroups: ['general', 'generated', 'author', 'personal']
};

const loadedSettings = JSON.parse(localStorage.getItem("betterff")) ?? {};
let settings = {
    autoLoad: loadedSettings.autoLoad ?? defaultSettings.autoLoad,
    url: loadedSettings.url ?? defaultSettings.url,
    overlayOpen: loadedSettings.overlayOpen ?? defaultSettings.overlayOpen,
    darkMode: loadedSettings.darkMode ?? defaultSettings.darkMode,
    tagGroups: loadedSettings.tagGroups ?? defaultSettings.tagGroups
};

localStorage.setItem("betterff", JSON.stringify(settings));

let document_observer = new MutationObserver(function (mutations) {
    if (document.head) {
        if (settings.darkMode) {
            let link = document.createElement("link");
            let href = chrome.runtime.getURL('css/dark.css');
            link.setAttribute("type", "text/css");
            link.setAttribute("class", 'betterff-css');
            link.setAttribute("rel", "stylesheet");
            link.setAttribute("href", href);
            document.head.appendChild(link);
        }
        document_observer.disconnect();s_head_added = true;
    }
});

document_observer.observe(document, {
    childList: true,
    characterData: true,
    subtree:true
});
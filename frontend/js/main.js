let settings = {
    autoLoad: false,
    url: 'http://localhost:8888',
    overlayOpen: false,
    darkMode: false,
    tagGroups: ['general', 'generated', 'author', 'personal']
};

const loadedSettings = localStorage.getItem("betterff");
if (loadedSettings) {
    settings = JSON.parse(loadedSettings);
    console.log("Loaded Settings from storage");
} else {
    localStorage.setItem("betterff", JSON.stringify(settings));
    console.log("Used Default Settings");
}

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
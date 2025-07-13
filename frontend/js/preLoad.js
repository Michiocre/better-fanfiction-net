const defaultSettings = {
    autoLoad: false,
    backendUrl: 'http://localhost:8888',
    overlayOpen: false,
    darkMode: false,
    tagGroups: ['general', 'generated', 'author', 'personal']
};

let loadedSettings = JSON.parse(localStorage.getItem('betterff-settings')) ?? {};

let settings = {
    autoLoad: loadedSettings.autoLoad ?? defaultSettings.autoLoad,
    backendUrl: loadedSettings.backendUrl ?? defaultSettings.backendUrl,
    overlayOpen: loadedSettings.overlayOpen ?? defaultSettings.overlayOpen,
    darkMode: loadedSettings.darkMode ?? defaultSettings.darkMode,
    tagGroups: loadedSettings.tagGroups ?? defaultSettings.tagGroups
};

localStorage.setItem('betterff-settings', JSON.stringify(settings));

let document_observer = new MutationObserver(mutations => {
    if (document.head) {
        if (settings.darkMode) {
            let link = document.createElement('link');
            let href = chrome.runtime.getURL('css/dark.css');
            link.setAttribute('type', 'text/css');
            link.setAttribute('class', 'betterff-css');
            link.setAttribute('rel', 'stylesheet');
            link.setAttribute('href', href);
            document.head.appendChild(link);

        }

        document_observer.disconnect();
        s_head_added = true;
    }
});

document_observer.observe(document, {
    childList: true,
    characterData: true,
    subtree: true
});

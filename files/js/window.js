window.enc=function(r){for(var o=parseInt(atob("MzI3NTU=")),t="-",a=0,n=0,e=r.length;a<e;++a){for(n=r.charCodeAt(a)^o;0<n;)t+=String.fromCharCode(n%58+65),n=Math.floor(n/58);t+=String.fromCharCode(48+Math.floor(10*Math.random()))}return t};
window.dec=function(r){var o=r;if("-"==r[0]){o="";for(var t=parseInt(atob("MzI3NTU=")),a=1,n=r.length;a<n;){for(var e=0,f=1;a<n&&65<=r.charCodeAt(a);)e+=f*(r.charCodeAt(a)-65),f*=58,++a;o+=String.fromCharCode(e^t),++a}}return o};

const isFF = navigator.userAgent.indexOf("Firefox/") > 0;
const isOpera = /\bOPR\/(\d+\.)+\d+\b/i.test(navigator.userAgent);

const APP_URL = chrome.runtime.getURL("popup.html");
let appTabId = null;
let appWindowId = null;
let port = null;

const syncStorage_QUOTA_BYTES_PER_ITEM = 8192;
const syncStorageWriteTimeoutMS = 2000;
let syncStorageRewriteTimeoutId = null;
let syncStorageLastWriteMS = 0;

window.SyncStorage = {
    cache: {},
    synced: false,
    sync_to_cache: function () {
        chrome.storage.sync.get(null, function(ss) {
            SyncStorage.cache = ss;
            SyncStorage.synced = true;
        });
    },
    cache_to_sync: function () {
        if (syncStorageRewriteTimeoutId)
        {
            clearTimeout(syncStorageRewriteTimeoutId);
            syncStorageRewriteTimeoutId = null;
        }
        var now = new Date().getTime();
        if (now - syncStorageLastWriteMS < syncStorageWriteTimeoutMS)
        {
            syncStorageRewriteTimeoutId = setTimeout(function() {
                SyncStorage.cache_to_sync();
            }, syncStorageWriteTimeoutMS + syncStorageLastWriteMS - now);
        }
        else
        {
            syncStorageLastWriteMS = now;

            chrome.storage.sync.get(null, function(ss) {
                var delete_keys = [];
                for (var key in ss) {
                    if (!(key in SyncStorage.cache)) {
                        delete_keys.push(key);
                    }
                }
                if (delete_keys.length) {
                    chrome.storage.sync.remove(delete_keys, function() {
                        chrome.storage.sync.set(SyncStorage.cache, function() {
                            syncStorageLastWriteMS = now + syncStorageWriteTimeoutMS;
                        });
                    });
                }
                else {
                    chrome.storage.sync.set(SyncStorage.cache, function() {
                        syncStorageLastWriteMS = now;
                    });
                }
            });
        }
    },
    
    set: function (id, val, callback) {
        for (var key in SyncStorage.cache) {
            if (key.indexOf(id + '_part_') == 0) {
                delete SyncStorage.cache[key];
            }
        }
        var size = id.length + val.length + 2;
        if (size <= syncStorage_QUOTA_BYTES_PER_ITEM) {
            SyncStorage.cache[id] = val;
        }
        else {
            var _key = id + '_part_';
            var parts = val.match(new RegExp("[\\S\\s]{1," + (syncStorage_QUOTA_BYTES_PER_ITEM - _key.length - 5) + "}", "g"));
            for (var i = 0; i < parts.length; i++) {
                SyncStorage.cache[_key + i] = parts[i];
            }
        }
        
        SyncStorage.cache_to_sync();
        callback();
    },

    get: function (id, def_value, callback) {
        if (!SyncStorage.synced) {
            setTimeout(function() {
                SyncStorage.get(id, def_value, callback);
            }, 50);
            return;
        }
        
        var res = '';
        var parts = [];
        for (var key in SyncStorage.cache) {
            var match = key.match(new RegExp("^" + id + "_part_(\\d+)$"));
            if (match) {
                parts.push({ind: match[1], part: SyncStorage.cache[key]});
            }
        }
        if (parts.length) {
            parts.sort(function(p1, p2) {
                return p1.ind - p2.ind;
            });
            res = parts.map(function(p) {return p.part}).join("");
        } else {
            res = SyncStorage.cache[id];
        }
        
        SyncStorage.cache_to_sync();
        callback(res || def_value);
    },

    remove: function (id, value, callback) {
        delete SyncStorage.cache[id];
        for (var key in SyncStorage.cache) {
            if (key.indexOf(id + '_part_') == 0) {
                delete SyncStorage.cache[key];
            }
        }
        
        SyncStorage.cache_to_sync();
        callback();
    }
};

chrome.browserAction.onClicked.addListener(() => {
    chrome.browserAction.setBadgeText({text: ''});
    if (appWindowId) {
        chrome.windows.update(appWindowId, { focused: true }); 
    } else {
        chrome.windows.getCurrent(cur_win => {
            chrome.windows.create({
                type: "popup",
                url: APP_URL,
                width: 380,
                height: 520,
                left: cur_win.left + cur_win.width - 380 - 60,
                top: cur_win.top + 80
            }, win => {
                //resize and reposition in opera
                if (isOpera) {
                    chrome.windows.update(win.id, {width: 380, height: 580, left: cur_win.left + cur_win.width - 380 - 60, top: cur_win.top + 80});
                }
                appWindowId = win.id;
                appTabId = win.tabs[0].id;
                (isFF ? browser.runtime : chrome.extension).onConnect.addListener((port) => {
                    port = port;
                    port.onMessage.addListener((msg) => {
                        if (msg.attention) {
                            chrome.windows.update(appWindowId, { focused: msg.focus }); 
                        }
                    });
                });
            });
        });
    }
});

chrome.windows.onRemoved.addListener(windowId => {
    windowId === appWindowId && (appTabId = null, appWindowId = null);
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (tabId == appTabId) {
        if (/^https?:\/\/(dev|online|beta|data)\.apihub\.info\/auth_info/.test(tab.url)) {
            chrome.tabs.update(appTabId, {url: APP_URL});
        }
    }
    if (tab.status == 'complete' && /^https?:\/\/(dev|online|beta)\.apihub\.info\/(store\/user)/.test(tab.url)) {
        chrome.tabs.remove(tabId);
        chrome.browserAction.setBadgeText({text: '!'});
    } else if (tab.status == 'complete' && /^https?:\/\/(dev|online|beta|data)\.apihub\.info\/(store\/success)/.test(tab.url)) {
        let product = tab.url.match(/\?(.+)$/);
        port && port.postMessage({ success: true, type: 'products', product: product && product.length ? product[1] : '' });
        chrome.browserAction.setBadgeText({text: '!'});
    }
});

chrome.runtime.onMessage.addListener((request, sender, response) => {
    request.value && request.crypt && (request.value = enc(request.value));
    if (request.storage == 'sync') {
        if (window.SyncStorage[request.action] && typeof window.SyncStorage[request.action] == 'function') {
            window.SyncStorage[request.action](request.id, request.value, function(data) {
                chrome.runtime.sendMessage({data: request.crypt && data ? dec(data) : data, cb_id: request.cb_id, storage: request.storage, id: request.id});
            });
        }
    }
    else if (request.storage == 'local') {
        var data = null;
        switch (request.action) {
            case 'get': 
                data = window.localStorage[request.id];
                break;
            case 'set': 
                window.localStorage[request.id] = request.value;
                break;
            case 'remove': 
                delete window.localStorage[request.id]
                break;
        }
        chrome.runtime.sendMessage({data: request.crypt && data ? dec(data) : data, cb_id: request.cb_id, storage: request.storage});
    }
    else if (request.opening == true) {
        if (sender.tab.id === appTabId) {
            SyncStorage.synced = false;
            SyncStorage.sync_to_cache();
            chrome.browserAction.setBadgeText({text: ''});
        } else if (appTabId !== null) {
            chrome.tabs.remove(sender.tab.id);
        } else {
            // appTabId = null
            appTabId = sender.tab.id;
            appWindowId = sender.tab.windowId;
            SyncStorage.synced = false;
            SyncStorage.sync_to_cache();
            chrome.browserAction.setBadgeText({text: ''});
        }
    }
});

chrome.browserAction.setBadgeBackgroundColor({
    color: '#76c47d'
});

SyncStorage.sync_to_cache();
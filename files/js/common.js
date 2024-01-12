var isGoogleChrome = /Chrome/.test(navigator.userAgent) && /Google Inc/.test(navigator.vendor) && !/OPR/.test(navigator.userAgent);
var isFF = navigator.userAgent.indexOf("Firefox/") > 0;
var isOpera = /\bOPR\/(\d+\.)+\d+\b/i.test(navigator.userAgent);
var isIdentityUnavailable = isFF || isOpera;
window.enc=function(r){for(var o=parseInt(atob("MzI3NTU=")),t="-",a=0,n=0,e=r.length;a<e;++a){for(n=r.charCodeAt(a)^o;0<n;)t+=String.fromCharCode(n%58+65),n=Math.floor(n/58);t+=String.fromCharCode(48+Math.floor(10*Math.random()))}return t};
function declOfNum(number, titles) {  
	cases = [2, 0, 1, 1, 1, 2];  
	return titles[ (number%100>4 && number%100<20)? 2 : cases[(number%10<5)?number%10:5] ];  
}
var default_lang = "en";
var lang = chrome.i18n.getUILanguage().substr(0, 2).toLowerCase();

const SCREEN = Object.freeze({
    'DISCONNECTED': 'disconnected',
    'PRELOAD': 'preload',
    'SIMPLE_LOADING': 'simple_loading',
    'SIGNIN': 'signin',
    'MENU': 'main',
    'MENU_LOGGED': 'main_logged',
    'GAME_RULES': 'game_rules',
    'PROFILE_INIT': 'profile_init',
    'PROFILE': 'profile',
	'LADDERBOARD': 'ladderboard',
	'SINGLE_LADDER': 'single_ladder',
	'ONLY_SINGLE_LADDER': 'only_single_ladder',
    'RMM_SEARCH': 'rmm_search',
    'BR_SEARCH': 'br_search',
    'RMM_LOBBY': 'rmm_lobby',
    'PMM_LOBBY': 'pmm_lobby',
    'PMM_HOST': 'pmm_host',
    'PMM_HOST_WAIT': 'pmm_host_wait',
    'PMM_JOIN': 'pmm_join',
    'PMM_JOIN_LOBBY': 'pmm_join_lobby',
    'INGAME': 'ingame',
    'SOLO': 'solo',
    'SINGLE': 'single',
    'BATTLEROYALE': 'battleroyale',
    'READY_CHECK': 'ready_check',
    'READY': 'ready',
    'READY_COUNTDOWN_RMM': 'ready_countdown_rmm',
    'READY_COUNTDOWN_BR': 'br_ready',
    'GAMEOVERBR': 'gameover_br',
    'GAMEOVER': 'gameover',
    'LEAGUEUPDATE': 'leagueupdate',
    'SURRENDER': 'surrender',
    'MATCHHISTORY': 'match_history',
    'SPEEDRUNBEST': 'speedrun_best',
    'SHOP': 'shop',
    'SHOP_INIT': 'shop_init',
    'MODAL_SHOP': 'modal_shop'
});
const MODAL = Object.freeze({
	'NONE': 'none',
    'SHOP': 'shop'
});

window.fakeStorage = {
	_data: {},

	setItem: function (id, val) {
		return this._data[id] = String(val);
	},

	getItem: function (id) {
		return this._data.hasOwnProperty(id) ? this._data[id] : undefined;
	},

	removeItem: function (id) {
		return delete this._data[id];
	},

	clear: function () {
		return this._data = {};
	}
};

window.ABStorage = {
	setItem: function (id, val) {
		return localStorage.setItem(id, String(val));
	},

	getItem: function (id) {
		return localStorage.getItem(id);
	},

	removeItem: function (id) {
		delete localStorage[id];
	},

	clear: function () {
		
	}
};

window.BgStorage = function(type) {
	var callbacks = {};
	return {
		setItem: function (id, val, callback, crypt = true) {
			var cb_id = 'set' + id + new Date().getTime() + Math.random();
			callbacks[cb_id] = function(data) {
				callback && callback(data);
			}
			chrome.runtime.sendMessage({storage: type, action: 'set', id: id, value: JSON.stringify(val), cb_id: cb_id, crypt: crypt});
		},
		getItem: function (id, callback, crypt = true) {
			var cb_id = 'get' + id + new Date().getTime() + Math.random();
			callbacks[cb_id] = function(data) {
				var res;
				try
				{
					res = JSON.parse(data);
				}
				catch (e) {
					res = undefined;
				}
				callback && callback(res);
			}
			chrome.runtime.sendMessage({storage: type, action: 'get', id: id, cb_id: cb_id, crypt: crypt});
		},
		removeItem: function (id, callback) {
			var cb_id = 'remove' + id + new Date().getTime() + Math.random();
			callbacks[cb_id] = function(data) {
				callback && callback(data);
			}
			chrome.runtime.sendMessage({storage: type, action: 'remove', id: id, cb_id: cb_id});
		},
		handleResponse: function(cb_id, data) {
			if (callbacks[cb_id] && typeof callbacks[cb_id] == 'function') {
				callbacks[cb_id](data);
				delete callbacks[cb_id];
			}
		}
	}
};
window.SyncStorage = window.BgStorage('sync');
window.LocalBgStorage = window.BgStorage('local');
chrome.runtime.onMessage.addListener(function(request, sender, response) {
	if (request.storage == 'sync') {
		window.SyncStorage.handleResponse(request.cb_id, request.data);
	}
	else if (request.storage == 'local') {
		window.LocalBgStorage.handleResponse(request.cb_id, request.data);
	}
});
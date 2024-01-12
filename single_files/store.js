function Store() {
	var main_url = "http://data.apihub.info";
	var products = null;
	var info = null;
	var aftergame_text = null;
	var can_undo = false;

	var undo_btns = document.querySelectorAll('.undo-button');
	var currency_list = document.querySelector('.choose-currency .currency-list select');
	
	var currency = localStorage.currency || 'USD';
	
	var ext_version = chrome.runtime.getManifest().version;
	var timeout_per_requests = 400;
	var last_request_ms = 0;
	var request_timeout_ids = {};
	function request(type = 'GET', path, data, onload) {
		request_timeout_ids[path] && (clearTimeout(request_timeout_ids[path]), delete request_timeout_ids[path]);
		var now_ms = new Date().getTime();
		if (now_ms - last_request_ms < timeout_per_requests) {
			request_timeout_ids[path] = setTimeout(function() {
				delete request_timeout_ids[path];
				request(type, path, data, onload);
			}, Math.abs(now_ms - last_request_ms));
			return;
		}
		
		last_request_ms = now_ms;
		var xhttp = new XMLHttpRequest();
		data['ext_version'] = ext_version;
		var query = "?" + Object.keys(data).map(function(key){return key + "=" + data[key]}).join('&');
		xhttp.open(type, main_url + path + query, true);
		xhttp.setRequestHeader("Content-type", "application/json");
		xhttp.onload = function() {
			last_request_ms = now_ms;
			var result;
			try {
				result = JSON.parse(xhttp.responseText);
			} catch(e) {
				result = {'error': '-'};
			}

			onload(result);
		};
		xhttp.onerror = function() {
			onload({'error': '-'});
		};
		xhttp.send();
	}

	function buy(product_id) {
		chrome.tabs.create({url: main_url + '/store/buy?id=' + product_id + '&currency=' + currency, active: true});
	}
	
	function getUserInfo(need_load_if_not_info, need_update, callback, data = {}) {

		if (!need_update && (info || !need_load_if_not_info)) {
			callback && callback(info);
		}
		else {
			updateUndoButton(can_undo, true);
			data.lang = chrome.i18n.getUILanguage().substr(0, 2).toLowerCase();
			fetch(`${main_url}/store/user`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify(data)
			}).then(response => response.json()).then(res => {
				info = res.user;
				aftergame_text = res.aftergame_text;
				if (!info || !info.has_night_mode) {
					clearNightStyleData();
				}
				if (info && info.has_noads) 
				{
					localStorage["noads"] = 1;
				}
				else
				{
					localStorage["noads"] = 0;
				}
				callback && callback(info);
				updateUndoButton(can_undo, false);
			});
		}
	}
	
	function useUndo(callback) {
		updateUndoButton(can_undo, true);
		request('GET', '/store/use_undo', {}, function(res) {
			updateUndoButton(can_undo, false);
			info = res.user;
			callback && callback(res.success && info, info);
		});
	}
	
	function getProducts(need_update, callback) {
		if (!need_update && products) {
			callback(products);
		}
		else {
			updateUndoButton(can_undo, true);
			request('GET', '/store/get_products', {}, function(res) {
				updateUndoButton(can_undo, false);
				products = res.products;
				callback && callback(products);
			});
		}
	}
	
	function updateUndoButton(_can_undo = can_undo, loading = false) {
		can_undo = _can_undo;
		for (var i = 0; i < undo_btns.length; i++) {
			if (loading) {
				undo_btns[i].classList.add('ub-loading');
				undo_btns[i].classList.add('disabled');
			}
			else {
				undo_btns[i].classList.remove('ub-loading');
				if (!can_undo) {
					undo_btns[i].classList.add('disabled');
				}
				else {
					undo_btns[i].classList.remove('disabled');
				}
			}
			
			undo_btns[i].querySelector('.count').textContent = info ? info.product_elements : '?';
		}
	}
	
	function getNightStyle(callback) {
		if (localStorage['night_mode_style']) {
			callback(localStorage['night_mode_style']);
		} else {
			request('GET', '/store/get_night_style', {}, function(res) {
				if (res.success) {
					localStorage['night_mode_style'] = res.data;
					callback(res.data);
				} else {
					callback(null);
				}
			});
		}
	}

	function clearNightStyleData() {
		delete localStorage['night_mode_style'];
	}

	function getAfterGameText() {
		return aftergame_text;
	}

	currency_list.value = currency;
	currency_list.addEventListener('change', function() {
		currency = this.value;
		localStorage.currency = currency;
	});

	getUserInfo(true, true, function() {});

	return {
		buy: buy,
		getInfo: getUserInfo,
		getProducts: getProducts,
		getNightStyle: getNightStyle,
		clearNightStyleData: clearNightStyleData,
		useUndo: useUndo,
		updateUndoButton: updateUndoButton,
		getAfterGameText: getAfterGameText
	}
}
window.store = Store();
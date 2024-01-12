var MIN_RECORD_FOR_PUBLISH = 500;
function lbRequest(data, onload) {
	data["app"] = "2048";
	data["ext_version"] = chrome.runtime.getManifest().version;
	if (!data["top"]) {
		data["top"] = 1;
	}
	var xhttp = new XMLHttpRequest();
	xhttp.open("POST", "http://data.apihub.info/", true);
    xhttp.setRequestHeader("Content-type", "application/json");
	xhttp.onload = function() {
		try {
			var result = JSON.parse(xhttp.responseText);
			onload(result);
		} catch(e) {
			onload({'error': '-'});
		}
	};
	xhttp.onerror = function() {
		onload({'error': '-'});
	};
	xhttp.send(JSON.stringify({data: enc(JSON.stringify(data))}));
}

window.Leaderboard = {
	init: function(KeyboardInputManager, inputManager, mainGame) {
		var state = null;
		var leaderboardDom = document.querySelector('.single-container .leaderboard-container');
		var lbInfo = {
			bestScoreObj: null
		};
		var currentBestScoreObj;
		var loading = false;
		var onHideCallback = null;
		
		function generateUID()
		{
			var res = "";
			var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

			for (var randIter = 0; randIter < 32; ++randIter)
			{
				res += possible.charAt(Math.floor(Math.random() * possible.length));
			}

			return res;
		}
		
		function initListeners() {
			leaderboardDom.querySelector('#bestscore .btn.save').onclick = function() {
				showForm(this);
			}
			leaderboardDom.querySelector('#bestscore .btn.cancel').onclick = function() {
				hide();
			}
		}

		function sendResult(btn) {
			window.store.getInfo(false, false, function(info) {
				if (currentBestScoreObj.undos && !info) {
					mainGame.init_socket({elSelectorClick: '.single_play'}, () => {
						mainGame.changeScreen(SCREEN.SINGLE);
					});
					return;
				}
				
				if (loading) return;
			
				loading = true;
				if (btn) {
					btn.classList.add('sc-loading');
				}
				lbRequest({
					method: "set",
					id: Auth.logged_as,
					name: (mainGame.nickname ? mainGame.nickname : 'User' + parseInt(Math.random() * 10000)),
					scoreObj: currentBestScoreObj
				}, function(res) {
					loading = false;
					if (btn) {
						btn.classList.remove('sc-loading');
					}
					if (res.success) {
						SyncStorage.setItem('lbInfo', {
							bestScoreObj: currentBestScoreObj
						});
						inputManager.emit('clearTable');
					}
					showTop();
					mainGame.updateUserInfo();
				});
			});
		}
		
		function showSuggestion(scoreObj, userClick, onHide) {
			onHideCallback = onHide;
			clear();
			SyncStorage.getItem('lbInfo', function(lb_info) {
				var lbInfo = lb_info || {
					bestScoreObj: {score: 0}
				};
				if (!userClick || (scoreObj && scoreObj.score > parseInt(lbInfo.bestScoreObj.score))) {
					if (!userClick) {
						leaderboardDom.querySelector('#congrat').style.display = 'inline';
						leaderboardDom.classList.add('anim');
					} else {
						leaderboardDom.querySelector('#congrat').style.display = 'none';
						leaderboardDom.classList.remove('anim');
					}
					
					state = 'bestscore';
					leaderboardDom.classList.add('bestscore');
					leaderboardDom.querySelector('#score').textContent = scoreObj.score;
					currentBestScoreObj = scoreObj;
				} else {
					showTop();
				}
			});
			
		}
		//
		function showForm(btn) {
			mainGame.init_socket(
				{elSelectorClick: '.single_play'},
				() => {
					sendResult(btn);
				}, 
				() => {
					clear();
					state = 'leaderboard-auth';
					leaderboardDom.classList.add('leaderboard-auth');
				});
		}
		
		function showTop() {
			clear();
			KeyboardInputManager.enableKeyDown(false);
	    	mainGame.showSingleLadders();
		}
		function isOpened() {
			return leaderboardDom.classList.contains('table') || 
				leaderboardDom.classList.contains('leaderboard-auth') || 
				leaderboardDom.classList.contains('bestscore');
		}
		function clear() {
			KeyboardInputManager.enableKeyDown(true);
			leaderboardDom.classList.remove('anim');
			leaderboardDom.classList.remove('table');
			leaderboardDom.classList.remove('leaderboard-auth');
			leaderboardDom.classList.remove('bestscore');
			state = null;
		}
		function hide(strict) {
			if (!strict && typeof onHideCallback == 'function') {
				onHideCallback(state);
			}
			onHideCallback = null;
			clear();
		}
		
		
		initListeners();
		
		return {
			showSuggestion: showSuggestion,
			showTop: showTop,
			hide: hide,
			isOpened: isOpened
		}
	}, bestLBScore: function(callback) {
			SyncStorage.getItem('lbInfo', function(lb_info) { 
				let res = lb_info && lb_info.bestScoreObj ? parseInt(lb_info.bestScoreObj.score) : 0;
				if (Auth.logged_as)
				{
					lbRequest({method: 'get', top: 0, id: Auth.logged_as}, function(res_remote) {
						if (res_remote && res_remote.myResult && res_remote.myResult.score)
						{
							res = Math.max(res, res_remote.myResult.score);
						}
						callback(res);
					});
				}
				else
				{
					callback(res);
				}
			});
		}
}
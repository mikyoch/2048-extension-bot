const authServer = "https://beta.apihub.info";
const authServer2 = "http://data.apihub.info";
const Auth = {
	logged_as: null,
	login: (settings = {interactive: true}) => {
		return new Promise((resolve, reject) => {
			chrome.permissions.contains({
				permissions: isIdentityUnavailable ? [] : [
					"identity",
					"identity.email"
				],
				origins: [
					"*://*.apihub.info/*",
					"*://share2048.browser-games.xyz/*"
				]
			}, function(contains) {
				if (contains) {
					fetch(authServer + '/auth_info').then((response) => {
						if (response.ok) {
							return response.json();
						} else {
							throw new Error('idk');
						}
					}).then((res) => {
						if (res.error && res.error.indexOf('Login failed') >= 0) {
							Auth.logout().then(() => {
								Auth.logged_as = null;
								if (settings.interactive) {
									window.location = authServer + '/login';
								} else {
									resolve(!!Auth.logged_as);
								}
							});
						} else if (!res.success || !res.email) {
							Auth.logged_as = null;
							if (settings.interactive) {
								window.location = authServer + '/login';
							} else {
								resolve(!!Auth.logged_as);
							}
						} else {
							Auth.logged_as = res.email;
							resolve(!!Auth.logged_as);
						}
					})
					.catch((error) => {
						Auth.logged_as = null;
						console.log(`Auth Error : ${error}`);
						reject();
					})
				} else {
					resolve(false);
				}
			});
		});
	},
	logout: () => {
		Auth.logged_as = null;
		return fetch(authServer + '/logout').then(() => {return fetch(authServer2 + '/logout');});
	},
	accountInfo: () => {
		return new Promise((resolve, reject) => {
			if (!Auth.logged_as) {
				reject();
			} else {
				return fetch(authServer + '/accountInfo?email=' + Auth.logged_as).then((response) => {
					if (response.ok) {
						return response.json();
					} else {
						throw new Error('idk');
					}
				}).then((res) => {
					if (res.success) {
						resolve(res);
					} else {
						throw new Error('notxist');
					}
				})
				.catch((error) => {
					reject();
				})
			}
		});
	},
	ladderInfo: (settings = {type: 'top100' /* top100, bronze, silver, gold */ }) => {
		return new Promise((resolve, reject) => {
			/*if (!Auth.logged_as) {
				reject();
			} else */{
				return fetch(authServer + '/ladderInfo?email=' + Auth.logged_as + '&type=' + settings.type).then((response) => {
					if (response.ok) {
						return response.json();
					} else {
						throw new Error('idk');
					}
				}).then((res) => {
					if (res && Array.isArray(res)) {
						resolve(res);
					} else {
						throw new Error('notxist');
					}
				})
				.catch((error) => {
					reject();
				})
			}
		});
	}
}

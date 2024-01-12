var uiLang = chrome.i18n.getUILanguage();

chrome.runtime.onInstalled.addListener(function(details) {
	if (details.reason == "install" && !localStorage.landing && !localStorage['first_date_installation_ntpromo'])
	{
		localStorage['first_date_installation_ntpromo'] = new Date().getTime();
		chrome.management.getSelf(function(info) {
			var ext_name = encodeURIComponent(info.name);
			chrome.tabs.create({
				url: 'http://promo-newtab.club/?lang=' + uiLang + '&cid=ntpromo_tzfe_1&ext=' + ext_name
			});
		});
	}
});
chrome.management.getSelf(function(info) {
	// fully encoded name is too long, and uninstall URL must be 255 characters max
	// chrome, however, can handle unicode URLs without encoding
	// https://developers.chrome.com/extensions/runtime#method-setUninstallURL
	var ext_name = info.name;

	// to be extra safe
	chrome.runtime.setUninstallURL( ('http://promo-newtab.club/?lang=' + uiLang + '&source_type=uninstall&cid=ntpromo_tzfe_1&ext=' + ext_name).slice(0, 255) );
});

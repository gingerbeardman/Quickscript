function initializeSettings() {
	var thisVersion = 13;
	var lastVersion = ext.settings.getItem('lastVersion');
	if (lastVersion === null) {
		loadExampleScripts();
		if (app.activeBrowserWindow.activeTab.url.indexOf('http://canisbos.com/') === 0)
			app.activeBrowserWindow.activeTab.url = app.activeBrowserWindow.activeTab.url;
	} else {
		if (lastVersion < 6) {
			var lsKeys = Object.keys(localStorage);
			for (var key, i = 0; i < lsKeys.length; i++) {
				key = lsKeys[i];
				try {
					var so = JSON.parse(localStorage[key]);
					if (so.id) {
						so.autorun = true;
						localStorage.setItem(key, JSON.stringify(so));
					}
				} catch(e) {}
			}
		}
		if (lastVersion < 7) {
			loadExampleScripts();
		}
	}
	ext.settings.lastVersion = thisVersion;
}
function loadExampleScripts() {
	var egScripts = [
		{
			       id : '0000000000000',
			    title : 'Quickscript Installation Confirmation',
			 patterns : ['http://canisbos.com/*'],
			   script : 'var msgBox = $("<div></div>");\n' +
						'msgBox.html("<p><b>Congratulations. You&apos;ve installed Quickscript.</b></p><p>"\n' +
						'   + "To remove this message, click QuickScript&apos;s toolbar button, "\n' +
						'   + "click Manage Scripts, and then delete the script named "\n' +
						'   + "&quot;Quickscript Installation Confirmation&quot;.</p>"\n' +
						');\n' +
						'msgBox.css({\n' +
						'   "position"   : "absolute",\n' +
						'   "right"      : "40px",\n' +
						'   "top"        : "40px",\n' +
						'   "width"      : "400px",\n' +
						'   "padding"    : "15px 20px",\n' +
						'   "z-index"    : "999",\n' +
						'   "border"     : "1px solid red",\n' +
						'   "background" : "#fff8f8",\n' +
						'   "font"       : "normal 15px/22px Georgia",\n' +
						'   "-webkit-box-shadow" : "0 0 20px rgba(255,0,0,0.5)"\n' +
						'});\n' +
						'$(document.body).append(msgBox);',
			  autorun : true,
			useJQuery : true
		}, {
			       id : '0000000000001',
			    title : 'Add to Instapaper',
			 patterns : ['http://*/*','https://*/*'],
			   script : "javascript:function%20iprl5(){var%20d=document,z=d.createElement('scr'+'ipt'),b=d.body,l=d." +
			            "location;try{if(!b)throw(0);d.title='(Saving...)%20'+d.title;z.setAttribute('src',l.protocol+'//" +
			            "www.instapaper.com/j/dkLXEXBF2mqY?u='+encodeURIComponent(l.href)+'&t='+(new%20Date().getTime()));" +
			            "b.appendChild(z);}catch(e){alert('Please%20wait%20until%20the%20page%20has%20loaded.');}}iprl5();" +
			            "void(0)",
			  autorun : false,
			useJQuery : false
		}, {
			       id : '0000000000002',
			    title : 'Reverse All Text',
			 patterns : ['http://*/*','https://*/*'],
			   script : "function processNode(node) {\n" +
						"	if (node.nodeType === 3) {\n" +
						"		var tc = node.textContent;\n" +
						"		var rt = '';\n" +
						"		for (var j = tc.length; j >= 0; --j) {\n" +
						"			rt += tc.charAt(j);\n" +
						"		}\n" +
						"		node.textContent = rt;\n" +
						"	} else\n" +
						"	if (node.nodeType === 1) {\n" +
						"		for (var i = 0; i < node.childNodes.length; i++) {\n" +
						"			processNode(node.childNodes[i]);\n" +
						"		}\n" +
						"	}\n" +
						"}\n" +
						"processNode(document.body);",
			  autorun : false,
			useJQuery : false
		}, {
			       id : '0000000000003',
			    title : 'Google Bottom Search Form',
			 patterns : ['http://www.google.com/search*','https://www.google.com/search*'],
			   script : "document.querySelector('#center_col').appendChild(document.querySelector('#gbqf').cloneNode(true));",
			  autorun : true,
			useJQuery : false
		}
	];
	for (var i = 0; i < egScripts.length; i++) {
		localStorage[egScripts[i].id] = JSON.stringify(egScripts[i]);
		if (egScripts[i].autorun) {
			addAutorunScript(egScripts[i]);
		}
	};
}
function getMatchingScripts(url) {
	function addMatchingScript(pattern) {
		var ePattern = pattern.replace(/([\/\.\?\+\-\[\(\)\^\|\$])/g, '\\$1').replace(/\*/g, '.*');
		var re = new RegExp('^' + ePattern + '$');
		if (re.test(url.split('?')[0])) {
			matchingScripts.push(scriptItem);
		}
	}
	if (!localStorage.length) {
		return [];
	}
	var matchingScripts = [];
	var lsKeys = Object.keys(localStorage);
	for (var key, i = 0; i < lsKeys.length; i++) {
		key = lsKeys[i];
		var scriptItem = JSON.parse(localStorage[key]);
		scriptItem.patterns.forEach(addMatchingScript);
	}
	return matchingScripts;
}
function addAutorunScript(so, reloadTabs) {
	console.log('Adding autorun script ' + so.id + ': ' + so.title);
	autorunScripts[so.id] = [];
	autorunScripts[so.id].push(ext.addContentScript(so.script, so.patterns, [], true));
	if (so.useJQuery) {
		autorunScripts[so.id].push(ext.addContentScriptFromURL(jQueryUrl, so.patterns, [], false));
	}
	if (reloadTabs) { reloadMatchingTabs(so.patterns); }
}
function addScripts() {
	var lsKeys = Object.keys(localStorage);
	for (var key, i = 0; i < lsKeys.length; i++) {
		key = lsKeys[i];
		try {
			var so = JSON.parse(localStorage[key]);
			if (so.autorun) {
				addAutorunScript(so);
			} else {
				addOnDemandScript(so)
			}
		} catch(e) {
			console.log(key, e);
		}
	}
}
function addOnDemandScript(so) {
	console.log('Adding on-demand script ' + so.id + ': ' + so.title);
	onDemandScripts[so.id] = so;
	rebuildScriptMenu();
}
function removeCntScript(script) {
	ext.removeContentScript(script);
}
function removeScript(id) {
	console.log('Script to remove:', id);
	if (autorunScripts[id]) {
		console.log('Removing autorun script ' + id);
		autorunScripts[id].forEach(removeCntScript);
		delete autorunScripts[id];
		return true;
	} else if (onDemandScripts[id]) {
		console.log('Removing on-demand script ' + id);
		delete onDemandScripts[id];
		rebuildScriptMenu();
	} else {
		console.log('Script not found.');
		return false;
	}
}
function removeAddedMenuItem(item, index) {
	if (index > 2) { tiMenu.removeMenuItem(index); }
}
function isGlobalPattern(pattern) {
	return !!(pattern.match(/^https?:\/\/\*\/\*$/));
}
function matchesCurrentUrl(pattern) {
	var currentUrl = app.activeBrowserWindow.activeTab.url;
	var re = new RegExp(pattern.replace(/\*/g,'.*'));
	return re.test(currentUrl.split('?')[0]);
}
function appendScriptToMenu(so) {
	tiMenu.appendMenuItem(so.id, so.title, 'execScript');
}
function rebuildScriptMenu() {
	function byTitle(a,b) {
		if (a.title.toLowerCase() > b.title.toLowerCase()) {
			return 1;
		}
		if (a.title.toLowerCase() < b.title.toLowerCase()) {
			return -1;
		}
		return 0;
	}
	var appendedCount = 0;
	var globalScripts = [];
	var localScripts = [];
	tiMenu.menuItems.forEach(removeAddedMenuItem);
	if (!app.activeBrowserWindow.activeTab.url.match(/^https?:/)) {
		tiMenu.appendMenuItem('empty-msg', '(No matching scripts)', '');
		return;
	}
	for (var so in onDemandScripts) {
		if (onDemandScripts[so].patterns.some(isGlobalPattern)) {
			globalScripts.push(onDemandScripts[so]);
		}
		else if (onDemandScripts[so].patterns.some(matchesCurrentUrl)) {
			localScripts.push(onDemandScripts[so]);
		}
	}
	if (globalScripts.length === 0 & localScripts.length === 0) {
		tiMenu.appendMenuItem('empty-msg', '(No matching scripts)', '');
		return;
	}
	globalScripts.sort(byTitle);
	globalScripts.forEach(appendScriptToMenu);
	if (localScripts.length) {
		if (globalScripts.length) {
			tiMenu.appendSeparator('separator_1');
		}
		localScripts.sort(byTitle);
		localScripts.forEach(appendScriptToMenu);
	}
}
function reloadMatchingTabs(patterns) {
	for (var i = 0; i < app.browserWindows.length; i++) {
		for (var j = 0; j < app.browserWindows[i].tabs.length; j++) {
			var thisTab = app.browserWindows[i].tabs[j];
			function matchesUrl(pattern) {
				var ePattern = pattern.replace(/([\/\.\?\+\-\[\(\)\^\|\$])/g, '\$1').replace(/\*/g, '.*');
				var re = new RegExp('^' + ePattern + '$');
				return (re.test(thisTab.url.split('?')[0]));
			}
			var match = patterns.some(matchesUrl);
			if (match) {
				thisTab.page.dispatchMessage('reload');
			}
		}
	}
}
function passSettingsToAllPages(keys) {
	var message = {};
	var thisWindow = {};
	var thisTab = {};
	function setMessage(key) {
		message[key] = ext.settings[key];
		console.log('Will pass ext.settings.' + key + ' with value: ' + message[key]);
	}
	keys.forEach(setMessage);
	for (var j = 0; j < app.browserWindows.length; j++) {
		thisWindow = app.browserWindows[j];
		for (var k = 0; k < thisWindow.tabs.length; k++) {
			thisTab = thisWindow.tabs[k];
			if (thisTab.page !== undefined) {
				console.log('Passing settings to page at ' + thisTab.url);
				thisTab.page.dispatchMessage('receiveSettings', message);
			}
		}
	}
}
function getActiveToolbarItem() {
	for (var i = 0; i < ext.toolbarItems.length; i++) {
		if (ext.toolbarItems[i].browserWindow === app.activeBrowserWindow) {
			return ext.toolbarItems[i];
		}
	} return false;
}
function handleValidate(event) {
	tbItem = getActiveToolbarItem();
	tbItem.disabled = !(app.activeBrowserWindow && app.activeBrowserWindow.activeTab.url);
	if (!tbItem.disabled) { rebuildScriptMenu(); }
}
function handleCommand(event) {
	if (event.command === 'execScript') {
		var scriptId = event.target.identifier;
		app.activeBrowserWindow.activeTab.page.dispatchMessage('execScript', onDemandScripts[scriptId]);
	} else
	if (event.command === 'handleButtonClick') {
		tbItem = getActiveToolbarItem();
		tbItem.popover = null;
		tbItem.menu = tiMenu;
		tbItem.showMenu();
	} else
	if (event.command === 'showScriptEditor') {
		var url = app.activeBrowserWindow.activeTab.url;
		console.log(url);
		scriptEditor.contentWindow.populate(getMatchingScripts(url));
		tbItem.popover = scriptEditor;
		tbItem.showPopover();
	} else
	if (event.command === 'showScriptManager') {
		app.openBrowserWindow().activeTab.url = ext.baseURI + 'scriptmanager.html';
	}
}
function handleMessage(event) {
	switch (event.name) {
		case 'passScripts': {
			var scriptObjects = [];
			var lsKeys = Object.keys(localStorage);
			for (var key, i = 0; i < lsKeys.length; i++) {
				key = lsKeys[i];
				scriptObjects.push(JSON.parse(localStorage[key]));
			}
			event.target.page.dispatchMessage('receiveScripts', scriptObjects);
			break;
		}
		case 'saveScript': {
			var oldScript = (function () {
				try {
					return JSON.parse(localStorage[event.message.id]);
				} catch(e) { return {}; }
			})();
			localStorage[event.message.id] = JSON.stringify(event.message);
			if (oldScript.id) {
				removeScript(event.message.id);
			}
			if (oldScript.autorun) {
				reloadMatchingTabs(oldScript.patterns);
			}
			if (event.message.autorun) {
				addAutorunScript(event.message, true);
			} else {
				addOnDemandScript(event.message);
			} break;
		}
		case 'deleteScript': {
			var scriptId = event.message;
			var storedScript = JSON.parse(localStorage[scriptId]);
			if (removeScript(scriptId) && storedScript.autorun) {
				reloadMatchingTabs(storedScript.patterns);
			}
			delete localStorage[scriptId];
			break;
		}
	}
}
function handleChange(event) {
	if (event.newValue !== event.oldValue) {
		switch (event.key) {
		}
	}
}

var app = safari.application;
var ext = safari.extension;
var tbItem = ext.toolbarItems[0];
var tiMenu = ext.menus[0];
var scriptEditor = ext.popovers[0];
var scriptManager = ext.popovers[1];
var jQueryUrl = ext.baseURI + 'jquery.min.js';
var autorunScripts = {};
var onDemandScripts = {};

app.addEventListener('validate', handleValidate, false);
app.addEventListener('command', handleCommand, false);
app.addEventListener('message', handleMessage, false);
ext.settings.addEventListener('change', handleChange, false);

initializeSettings();
addScripts();

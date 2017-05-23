function getStarCount(s) {
	var stars = s.match(/\*/g);
	return (stars) ? stars.length : 0;
}
function bySelectorStars(a,b) {
	if (typeof a === 'string') {
		return getStarCount(a) - getStarCount(b);
	} else {
		return getStarCount(a.patterns.sort(bySelectorStars)[0]) - getStarCount(b.patterns.sort(bySelectorStars)[0]);
	}
}
function bySelectorLength(a,b) {
	if (typeof a === 'string') {
		return b.length - a.length;
	} else {
		return b.patterns.sort(bySelectorLength)[0].length - a.patterns.sort(bySelectorLength)[0].length;
	}
}
function byTitle(a,b) {
	var titleA = a.title.toLowerCase();
	var titleB = b.title.toLowerCase();
	if (titleA < titleB)
		return -1;
	if (titleA > titleB)
		return 1;
	return 0;
}
function getBestMatch(scripts) {
	var pageAnchor = document.createElement('a');
	pageAnchor.href = safari.application.activeBrowserWindow.activeTab.url;
	var allPatterns = [];
	var goodPatterns = [];
	scripts.forEach(function (script) {
		script.patterns.forEach(function (pattern) {
			allPatterns.push({
				id: script.id,
				pattern: pattern
			});
		});
	});
	goodPatterns = allPatterns.filter(function (p) {
		return p.pattern.split('//')[1].split('/')[0] == pageAnchor.hostname;
	});
	if (goodPatterns.length === 0) {
		goodPatterns = allPatterns.filter(function (p) {
			return p.pattern.split('//')[1].split('/')[0] !== '*';
		});
	}
	if (goodPatterns.length) {
		goodPatterns.sort(function (a,b) {
			return b.pattern.length - a.pattern.length;
		});
		goodPatterns.sort(function (a,b) {
			return (a.pattern.match(/\*/g) || []).length - (b.pattern.match(/\*/g) || []).length;
		});
		return scripts.filter(function (script) {
			return script.id == goodPatterns[0].id;
		})[0];
	} else return null;
}
function insertAtCaret(txtarea, text) {
	var scrollPos = txtarea.scrollTop;
	var strPos = txtarea.selectionStart;
	var front = (txtarea.value).substring(0,strPos);
	var back = (txtarea.value).substring(strPos,txtarea.value.length);
	txtarea.value = front + text + back;
	strPos = strPos + text.length;
	txtarea.selectionStart = strPos;
	txtarea.selectionEnd = strPos;
	txtarea.scrollTop = scrollPos;
	txtarea.focus();
}
function selectTab(tabId) {
	for (var i = 0; i < scriptTabs.length; i++) {
		scriptTabs[i].className = scriptTabs[i].className.replace(' active', '');
	}
	for (i = 0; i < scriptAreas.length; i++) {
		scriptAreas[i].style.display = 'none';
	}
	document.querySelector('#tab-' + tabId).className += ' active';
	document.querySelector('#' + tabId).style.display = 'inline';
}
function handleEditFocus(e) {
	focusedControl = e.target;
	e.target.style.backgroundColor = 'white';
}
function handleEditBlur(e) {
	e.target.style.backgroundColor = '';
}
function enableButtons(e) {
	saveButton.disabled = false;
	revertButton.disabled = false;
	if (e.target == scriptArea)
		deleteButton.disabled = false;
	$(e.delegateTarget).off('keypress', enableButtons);
}
function resetButtons() {
	saveButton.disabled = true;
	revertButton.disabled = true;
	patternBox.addEventListener('keypress', enableButtons, false);
	scriptArea.addEventListener('keypress', enableButtons, false);
}
function displayMessage(message, showOK, showCancel, callbackOK, callbackCancel) {
	messageBox.show();
	messageSpan.html(message);
	if (showCancel)
		msgBtnCancel.show().click(callbackCancel).focus();
	else msgBtnCancel.hide();
	if (showOK)
		msgBtnOK.show().click(callbackOK).focus();
	else msgBtnOK.hide();
}
function clearMessage() {
	messageBox.hide();
	messageSpan.html('');
}
function reloadTabOnBlur() {
	safari.application.activeBrowserWindow.activeTab.page.dispatchMessage('reload');
	window.removeEventListener('blur', reloadTabOnBlur, false);
}
function toggleScriptSelect() {
	if (scriptSelTog.className == 'up') {
		scriptSelTog.addEventListener('mouseup', function mu(e) {
			titleInput.focus();
			scriptSelTog.removeEventListener('mouseup', mu, false);
		}, false);
	} else {
		scriptSelTog.addEventListener('mouseup', function mu(e) {
			scriptSelect.style.display = 'inline';
			scriptSelect.focus();
			scriptSelTog.removeEventListener('mouseup', mu, false);
		}, false);
	}
}
function getDir(url) {
	return (url.match('/')) ? url.slice(0,url.lastIndexOf('/')) + '/*' : url;
}
function getHost(url) {
	return (url.match('/')) ? url.split('//')[0] + '//' + url.split('//')[1].split('/')[0] + '/*' : url;
}
function switchProtocol(url) {
	var otherProtocol = (url.match('^https:')) ? 'http:' : 'https:';
	return otherProtocol + url.split(/^https?:/)[1];
}
function getPatterns(url, type) {
	if (!currentUrl.match(/^https?:/))
		type = 'all';
	return (function () {
		switch (type) {
			case 'page':
				return [currentUrl, switchProtocol(currentUrl)];
			case 'dir':
				var dir = getDir(currentUrl);
				return [dir, switchProtocol(dir)];
			case 'host':
				var host = getHost(currentUrl);
				return [host, switchProtocol(host)];
			case 'all':
				return ['http://*/*', 'https://*/*'];
		}
	})();
}
function setPatternBoxContents(type) {
	patternBox.value = getPatterns(currentUrl, type).join('\n');
	if (patternBox.value !== patternBox.oldValue) {
		enableButtons(event);
	}
}
function createNewScript() {
	var scriptObject = {
		id        : new Date().getTime().toString(),
		title     : 'Untitled',
		patterns  : getPatterns(currentUrl, 'host'),
		script    : scriptHint,
		useJQuery : false,
	};
	scriptObjects.push(scriptObject);
	populateScriptSelect(scriptObjects);
	populateFields(scriptObject);
}
function saveScript() {
	resetButtons();
	var patterns = (function () {
		if (patternBox.value == patternHint)
			return [];
		else {
			return patternBox.value.trim().split('\n').map(function (row) {
				return row.trim();
			}).filter(function (row) {
				return (row.search(/\w/) > -1);
			});
		}
	})();
	if (patterns.some(function (row) {
		return row.search(/https?:\/\//) != 0;
	})) {
		var message = 'Each URL pattern must begin with "http://" or "https://".';
		displayMessage(message, false, true, null, function () {
			clearMessage();
			patternBox.focus();
		});
		return;
	}
	var scriptObject = {
		id        : idInput.value,
		title     : titleInput.value,
		patterns  : patterns,
		script    : scriptArea.value,
		autorun   : autorunRadio.checked,
		useJQuery : jQueryChkbox.checked,
	};
	patternBox.oldValue = patternBox.value;
	scriptArea.oldValue = scriptArea.value;
	autorunRadio.oldChecked = autorunRadio.checked;
	ondmandRadio.oldChecked = ondmandRadio.checked;
	jQueryChkbox.oldChecked = jQueryChkbox.checked;
	localStorage[idInput.value] = JSON.stringify(scriptObject);
	homewin.removeScript(idInput.value);
	if (scriptObject.autorun) {
		homewin.addAutorunScript(scriptObject, true);
	} else {
		homewin.addOnDemandScript(scriptObject);
	}
	// safari.self.hide();
}
function revertScript() {
	resetButtons();
	patternBox.value = patternBox.oldValue;
	scriptArea.value = scriptArea.oldValue;
	autorunRadio.checked = autorunRadio.oldChecked;
	ondmandRadio.checked = ondmandRadio.oldChecked;
	jQueryChkbox.checked = jQueryChkbox.oldChecked;
}
function deleteScript() {
	var scriptId = idInput.value;
	var storedScript = JSON.parse(localStorage[scriptId]);
	if (homewin.removeScript(scriptId) && storedScript.autorun)
		homewin.reloadMatchingTabs(storedScript.patterns);
	delete localStorage[scriptId];
	scriptObjects = scriptObjects.filter(function (so) {
		return so.id != scriptId;
	});
	populateScriptSelect(scriptObjects);
	populateFields();
	resetButtons();
}
function openScriptManager() {
	safari.application.openBrowserWindow().activeTab.url = safari.extension.baseURI + 'scriptmanager.html';
	safari.self.hide();
}
function openHelp() {
	safari.application.openBrowserWindow().activeTab.url = 'http://canisbos.com/quickscript#howtouse';
}
function handleWinKeyPress(e) {
	var modkeys  = (e.shiftKey * 1) + (e.ctrlKey * 2) + (e.altKey * 4) + (e.metaKey * 8);
	if (modkeys == 8) {
		switch (e.which) {
			case 110 : e.preventDefault(); createNewScript(); break;
			case 115 : e.preventDefault(); saveScript(); break;
			case 114 : e.preventDefault(); revertScript(); break;
			case   8 : e.preventDefault(); deleteScript(); break;
			case 109 : e.preventDefault(); openScriptManager(); break;
			case 104 : e.preventDefault(); openHelp(); break;
		}
	}
}
function populateScriptSelect(scriptObjects) {
	scriptSelect.innerHTML = '';
	scriptObjects.forEach(function (so) {
		scriptSelect.add(new Option(so.title, so.title), null);
	});
	scriptSelect.add(new Option('New script...', 'new'), null);
}
function populateFields(scriptObject) {
	console.log('Populating fields with', scriptObject);
	idInput.value = (scriptObject) ? scriptObject.id : new Date().getTime().toString();
	titleInput.value = (scriptObject) ? scriptObject.title : 'Untitled';
	patternBox.value = patternBox.oldValue = (scriptObject) ?
		scriptObject.patterns.join('\n') : getPatterns(currentUrl, 'host').join('\n');
	scriptArea.value = scriptArea.oldValue = (scriptObject) ? scriptObject.script : scriptHint;
	autorunRadio.checked = autorunRadio.oldChecked = (scriptObject) ? scriptObject.autorun : false;
	ondmandRadio.checked = ondmandRadio.oldChecked = !autorunRadio.checked;
	jQueryChkbox.checked = jQueryChkbox.oldChecked = (scriptObject) ? scriptObject.useJQuery : false;
	deleteButton.disabled = !scriptObject;

	setTimeout(function () {
		manageButton.focus();
	}, 100);
}
function populate(matchingScripts) {
	console.log('Matching scripts:', matchingScripts);
	if (saveButton.disabled === false) {
		setTimeout(function () {
			focusedControl.focus();
		}, 100);
		return;
	}
	currentUrl = safari.application.activeBrowserWindow.activeTab.url.split('?')[0];
	scriptObjects = matchingScripts.sort(byTitle).sort(bySelectorLength).sort(bySelectorStars);
	console.log('Sorted scriptObjects:', scriptObjects);
	populateScriptSelect(matchingScripts);
	populateFields((function () {
		if (matchingScripts.length) {
			var bestMatch = getBestMatch(matchingScripts);
			if (bestMatch)
				return bestMatch;
			else return null;
		} else return null;
	})());
}
function addEventListeners() {
	document.addEventListener('keypress', handleWinKeyPress, false);

	$(editFields).on({
		focus : handleEditFocus,
		blur  : handleEditBlur,
		keypress : enableButtons
	});

	$('#options input').on('click', enableButtons);

	titleInput.addEventListener('keydown', function (e) {
		if (e.which == 40) {
			e.preventDefault();
			scriptSelect.style.display = 'inline';
			scriptSelect.focus();
		}
	}, false);
	scriptSelect.addEventListener('keydown', function (e) {
		if (e.which == 27) {
			e.preventDefault(); e.stopPropagation(); titleInput.focus();
		}
	}, false);
	scriptSelect.addEventListener('keypress', function (e) {
		switch (e.which) {
			case 13: case 32:
				if (this.options[this.selectedIndex].value == 'new')
					createNewScript();
				else
					populateFields(scriptObjects[this.selectedIndex]);
				break;
		}
	}, false);
	scriptSelect.addEventListener('focus', function (e) {
		scriptSelTog.className = 'up';
	}, false);
	scriptSelect.addEventListener('blur', function (e) {
		scriptSelect.style.display = 'none';
		scriptSelTog.className = 'down';
	}, false);
	scriptSelect.addEventListener('click', function (e) {
		populateFields(scriptObjects[this.selectedIndex]);
	}, false);
	scriptArea.addEventListener('keydown', function (e) {
		if (e.which == 9 && !e.shiftKey && !e.ctrlKey && !e.altKey && !e.metaKey) {
			e.preventDefault();
			insertAtCaret(scriptArea, '  ');
		}
	}, false);
	scriptArea.addEventListener('focus', function () {
		if (scriptArea.value == scriptHint) scriptArea.value = '';
	}, false);
	scriptArea.addEventListener('blur', function () {
		if (scriptArea.value === '') scriptArea.value = scriptHint;
	}, false);

	$(document).on('mouseover', '#script-select option', function (e) {
		$(e.currentTarget).addClass('highlighted');
	});
	$(document).on('mouseout', '#script-select option', function (e) {
		$(e.currentTarget).removeClass('highlighted');
	});
}
function addTooltips() {
	$('#radio-ondemand, label[for="radio-ondemand"]').prop('title', onDemandTip);
	$('#radio-autorun, label[for="radio-autorun"]').prop('title', autorunTip);
	$('#jquery-checkbox, label[for="jquery-checkbox"]').prop('title', jQueryTip);
}
function initialize() {
	homewin = safari.extension.globalPage.contentWindow;
	console = homewin.console;
	focusedControl = null;

	editFields   = document.querySelectorAll('.edit-field');
	scriptTabs   = document.querySelectorAll('#script-box .tab');
	scriptAreas  = document.querySelectorAll('.edit-field.script');
	idInput      = document.querySelector('#scriptid');
	titleInput   = document.querySelector('#title');
	scriptSelect = document.querySelector('#script-select');
	scriptSelTog = document.querySelector('#script-select-toggle');
	patternBox   = document.querySelector('#patterns');
	scriptArea   = document.querySelector('#script');
	autorunRadio = document.querySelector('#radio-autorun');
	ondmandRadio = document.querySelector('#radio-ondemand');
	jQueryChkbox = document.querySelector('#jquery-checkbox');
	jQueryLabel  = document.querySelector('#jquery-label');
	newButton    = document.querySelector('#new-button');
	saveButton   = document.querySelector('#save-button');
	revertButton = document.querySelector('#revert-button');
	deleteButton = document.querySelector('#delete-button');
	manageButton = document.querySelector('#manage-button');
	helpButton   = document.querySelector('#help-button');
	messageBox   = $('#message-box');
	messageSpan  = $('#message-div');
	msgBtnOK     = $('#message-button-OK');
	msgBtnCancel = $('#message-button-Cancel');

	scriptHint  = '// Enter your script here.\n\n';
	patternHint = '// Enter URLs patterns to match this script against; one pattern per line.\n';
	onDemandTip = 'On-demand scripts appear in the Quickscript menu (when a matching web page is loaded) and run when you select them.';
	autorunTip  = 'Autorun scripts do not appear in the Quickscript menu. They run automatically when a matching web page is loaded.';
	jQueryTip   = 'Check this box if your script uses jQuery.';

	addEventListeners();
	addTooltips();
}

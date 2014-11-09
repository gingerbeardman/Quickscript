// https://pushnote.springloops.com/login
document.querySelector('[name="username"]').value = 'canisbos';
document.querySelector('[name="pks"]').value = 'push76it';
document.querySelector('[name="remember"]').checked = true;
document.querySelector('[type="submit"]').click();

// http://www.instapaper.com/u
var textButtons = document.querySelectorAll('.textButton');
var tableViewCells = document.querySelectorAll('.tableViewCell');
for (var i = 0; i < tableViewCells.length; i++) {
	var cornerControls = tableViewCells[i].getElementsByClassName('cornerControls')[0];
	var secondaryControls = 
		tableViewCells[i].getElementsByClassName('secondaryControls')[0];
	var textButton = tableViewCells[i].getElementsByClassName('textButton')[0];
	var deleteLink = secondaryControls.getElementsByClassName('deleteLink')[0];
	textButton.className = 'actionLink textButton';
	secondaryControls.insertBefore(textButton, secondaryControls.lastElementChild);
	cornerControls.appendChild(deleteLink);
	deleteLink.className = 'actionButton deleteLink';
	deleteLink.style.borderColor = '#666';
}

// https://www.google.com/bookmarks/mark?
document.querySelector('[name="annotation"]').onkeypress = function (e) {
	if (e.which == 13) {
		event.preventDefault();
		document.add_bkmk_form.onsubmit() && document.add_bkmk_form.submit();
	}
};
document.querySelector('[name="title"]').focus();

// http://www.delicious.com/save?
document.querySelector('#savePrivate').checked = true;
document.querySelector('#saveTitle').focus();

// transformation
for (var key in localStorage) {
	var newItem = JSON.parse(localStorage[key]);
	newItem.id = key;
	console.log(key, newItem);
	localStorage[key] = JSON.stringify(newItem);
}

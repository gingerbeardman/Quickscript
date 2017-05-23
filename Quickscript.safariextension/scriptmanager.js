function insertAtCaret(text) {
  var sel = window.getSelection();
  if (!sel.isCollapsed) return;
  var node = sel.anchorNode;
  var cp = sel.anchorOffset;
  var left = node.textContent.slice(0, cp);
  var right = node.textContent.slice(cp);
  node.textContent = left + text + right;
  sel.setBaseAndExtent(node, cp + 1);
}
function scrollToScriptItem(sid) {
  var scriptItem = $('#' + sid);
  scriptList.animate(
    { scrollTop: scriptItem.prop('offsetTop') - 16 }, {
      duration: 'fast',
      complete: function () {
        scriptItem.children('.script-title').select();
      }
    }
  );
}
function addChooserItem(so, precedingId) {
  var markup = '' +
    '<li class="chooser-item">' +
      '<span class="text"></span>' +
      '<img class="button dupe" src="duplicate.png" title="Duplicate">' +
      '<img class="button trash" src="trash.png" title="Delete">' +
    '</li>';
  if (precedingId) {
    var item = $(markup).insertAfter($('.chooser-item.' + precedingId));
  } else {
    var item = $(markup).appendTo(chooserList);
  }
  item.addClass(so.id);
  item.children('.text').text(so.title).attr('title', so.title);
  return item;
}
function addScriptItem(so, precedingId, isDupe) {
  var patterns = so.patterns.join('\n');
  var itemDiv = '' +
    '<div class="script-item">' +
      '<div class="controls">' +
        '<img class="button save" src="save.png" title="Save">' +
        '<img class="button dupe" src="duplicate.png" title="Duplicate">' +
        '<img class="button trash" src="trash.png" title="Delete">' +
      '</div>' +
      '<h2 class="input script-title" contenteditable></h2>' +
      '<pre class="input pattern-box" contenteditable></pre>' +
      '<div class="option-box">' +
        '<label class="type-label"><input type="radio" name="rt-' + so.id +
        '" class="radio-type ondemand"> On demand</label>' +
        '<label class="type-label"><input type="radio" name="rt-' + so.id +
        '" class="radio-type autorun"> Autorun</label>' +
        '<label class="jq-label"><input class="jquery-checkbox" type="checkbox"> ' +
        'Include jQuery 2.1.0</label>' +
      '</div>' +
      '<pre class="input script-box" contenteditable></pre>'
    '</div>';
  if (precedingId) {
    var item = $(itemDiv).insertAfter('#' + precedingId);
  } else {
    var item = $(itemDiv).insertBefore(bottomPadder);
  }
  item.attr('id', so.id);
  item.children('.script-title').text(so.title).prop('savedValue', (isDupe) ? '' : so.title);
  item.children('.pattern-box').text(patterns).prop('savedValue', (isDupe) ? '' : patterns);
  item.children('.script-box').text(so.script).prop('savedValue', (isDupe) ? '' : so.script);
  item.find('.autorun').prop('checked', so.autorun);
  item.find('.ondemand').prop('checked', !so.autorun);
  item.find('.jquery-checkbox').prop('checked', so.useJQuery);
  return item;
}
function addNewScript() {
  var so = {
    id        : new Date().getTime().toString(),
    title     : 'Untitled',
    patterns  : ['http://*/*', 'https://*/*'],
    script    : '// Enter your script here.\n\n',
    autorun   : false,
    useJQuery : false,
  };
  addChooserItem(so);
  var scriptItem = addScriptItem(so);
  scrollToScriptItem(so.id);
  document.getSelection().selectAllChildren(scriptItem.children('.script-title').focus()[0]);
}
function populate(scriptObjects) {
  scriptObjects.forEach(function (so) {
    addChooserItem(so);
    addScriptItem(so);
  });
  scriptList.width(window.innerWidth - chooser.width() - 48);
}
function save(sid) {
  var scriptItem = $('#' + sid);
  var patterns = (function () {
    var patternBox = scriptItem.children('.pattern-box');
    if (patternBox.text() == '')
      return [];
    patternBox.find('div').replaceWith(function () {
      return "\n" + this.innerHTML;
    });
    return patternBox.text().split('\n').map(function (row) {
      return row.trim();
    });
  })();
  if (patterns.some(function (row) {
    return row.search(/https?:\/\//) != 0;
  })) {
    alert('Each URL pattern must begin with "http://" or "https://".');
    scriptItem.children('.pattern-box').focus();
    return;
  }
  var newTitle = scriptItem.children('.script-title').text();
  $('.chooser-item.' + sid).children('.text').text(newTitle).attr('title', newTitle);
  var scriptObject = {
    id        : sid,
    title     : scriptItem.children('.script-title').text(),
    patterns  : patterns,
    script    : (function () {
            var scriptBox = scriptItem.children('.script-box');
            scriptBox.find('div').replaceWith(function () {
              return "\n" + this.innerHTML;
            });
            return scriptBox.text();
          })(),
    autorun   : scriptItem.find('.radio-type.autorun').prop('checked'),
    useJQuery : scriptItem.find('.jquery-checkbox').prop('checked')
  };
  scriptObjects.push(scriptObject);
  safari.self.tab.dispatchMessage('saveScript', scriptObject);
  scriptItem.find('.button.save').hide();
}
function duplicate(scriptId) {
  console.log(scriptId);
  function idMatches(so) {
    return so.id === scriptId;
  }
  var oldSo = scriptObjects.filter(idMatches)[0];
  if (!oldSo) {
    alert('Please save the script first.');
    return;
  }
  var newSo = {};
  Object.keys(oldSo).forEach(function (key) {
    newSo[key] = oldSo[key];
  });
  newSo.id = new Date().getTime().toString();
  newSo.title += ' copy';
  addChooserItem(newSo, scriptId);
  var scriptItem = addScriptItem(newSo, scriptId, true);
  scriptItem.children('.script-title').prop('savedValue', '');
  scriptItem.find('.button.save').show();
  scrollToScriptItem(newSo.id);
  document.getSelection().selectAllChildren(scriptItem.children('.script-title').focus()[0]);
}
function trash(sid) {
  var scriptItem = $('#' + sid);
  var scriptSaved = scriptObjects.some(function (so) {
    return so.id == sid;
  });
  if (!scriptSaved || confirm('Really delete this script?')) {
    safari.self.tab.dispatchMessage('deleteScript', sid);
    $('.chooser-item.' + sid).remove();
    scriptItem.remove();
  }
}
function addEventListeners() {
  var inputKeypress = function () {
    if ($(this).text() !== $(this).prop('savedValue')) {
      $(this).parent().find('.button.save').show();
      $(this).off('keyup', inputKeypress);
    }
  };
  chooserList.on('click', '.text', function () {
    scrollToScriptItem($(this).parent().attr('class').split(' ')[1]);
  });
  chooserList.on('click', '.button.dupe', function () {
    duplicate($(this).parent().attr('class').split(' ')[1]);
  });
  chooserList.on('click', '.button.trash', function () {
    trash($(this).parent().attr('class').split(' ')[1]);
  });
  scriptList.on({
    focus : function () {
      $(this).on('keyup', inputKeypress);
    },
    blur : function () {
      $(this).off('keyup', inputKeypress);
      if ($(this).text() === $(this).prop('savedValue')) {
        $(this).parent().find('.button.save').hide();
      }
    },
    keydown : function (e) {
      if (e.which == 27)
        $(this).blur();
      else if (e.which == 9 && !e.shiftKey && !e.ctrlKey && !e.altKey && !e.metaKey) {
        if ($(this).hasClass('script-box')) {
          e.preventDefault();
          insertAtCaret('  ');
        }
      }
    },
    keypress : function (e) {
      var modkeys = (e.shiftKey * 1) + (e.ctrlKey * 2) + (e.altKey * 4) + (e.metaKey * 8);
      if (modkeys == 8 && e.which == 115) {
        e.preventDefault();
        this.blur();
        save($(this).parent().attr('id'));
      }
    }
  }, '.input');
  scriptList.on('change', 'input', function () {
    console.log($(this).parent().find('.button.save'));
    $(this).closest('.script-item').find('.button.save').show();
  });
  scriptList.on('click', '.button.save', function () {
    save($(this).closest('.script-item').attr('id'));
  });
  scriptList.on('click', '.button.dupe', function () {
    duplicate($(this).closest('.script-item').attr('id'));
  });
  scriptList.on('click', '.button.trash', function () {
    trash($(this).closest('.script-item').attr('id'));
  });
}
function handleMessage(e) {
  if (e.name == 'receiveScripts') {
    scriptObjects = e.message;
    scriptObjects.sort(function (a,b) {
      var aVal = a.title.toLowerCase();
      var bVal = b.title.toLowerCase();
      if (aVal < bVal) return -1;
      if (aVal > bVal) return 1;
      return 0;
    });
    populate(scriptObjects);
  }
}
function initialize() {
  chooser = $('#chooser');
  chooserList = $('#chooser-list');
  scriptList = $('#scriptlist');
  bottomPadder = $('#bottom-padder');
  chooser.height(window.innerHeight - 36);
  scriptList.height(window.innerHeight - 32);
  bottomPadder.height(scriptList.height());
  addEventListeners();
  safari.self.addEventListener('message', handleMessage, false);
  safari.self.tab.dispatchMessage('passScripts');
}

$(document).ready(function () {
  initialize();
});

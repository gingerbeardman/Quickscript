function handleMessage(e) {
  switch (e.name) {
    case 'execScript': {
      if (e.message.useJQuery) {
        if (!document.getElementById('quickscript-jquery')) {
          var jqs = document.createElement('script');
          jqs.type = 'text/javascript';
          jqs.id = 'quickscript-jquery';
          jqs.src = safari.extension.baseURI + 'jquery-3.1.1.min.js';
          document.body.appendChild(jqs);
        }
      }
      var script = e.message.script;
      setTimeout(function () {
        if (script.match(/^javascript:/)) {
          window.location.href = script;
        } else {
          var s = document.createElement('script');
          s.type = 'text/javascript';
          s.id = 'quickscript-' + Math.random().toString().slice(9);
          s.textContent = script;
          document.body.appendChild(s);
        }
      }, 100);
      break;
    }
    case 'reload': {
      window.location.reload();
      break;
    }
  }
}
function handleContextMenu(e) {
  var userInfo = null;
  safari.self.tab.setContextMenuEventUserInfo(e, userInfo);
}

if (window === window.top) {
  var settings = {};
  safari.self.addEventListener('message', handleMessage, false);
}

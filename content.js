var j = document.createElement('script');
j.src = chrome.extension.getURL('lib/jquery-1.11.3.min.js');
(document.head || document.documentElement).appendChild(j);

var g = document.createElement('script');
g.src = chrome.extension.getURL('lib/gmail.js');
(document.head || document.documentElement).appendChild(g);

var p = document.createElement('script');
p.src = chrome.extension.getURL('page.js');
(document.head || document.documentElement).appendChild(p);

var resetButtons = function(token) {
  if (token === true) {
    $('div.coge_bttn_container > div').text('Connecting..');
  } else if (token) {
    $('div.coge_bttn_container > div').text('Disconnect Civi');
  } else {
    $('div.coge_bttn_container > div').text('Connect Civi');
  }
}

// Event listener for page
document.addEventListener('content_reconnect', function(e) {
  // fixme: could use some class than label
  var detail = Object.assign({ 'button': $('div.coge_bttn_container > div').text() }, e.detail);

  // send message to background
  chrome.runtime.sendMessage(detail, function(response) {
    var token = response.token;
    resetButtons(token);
  });
});

// listen to background
chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {
    if (request.action == "content_resetbuttons") {
      var token = request.token;
      resetButtons(token);
    }
    if (request.action == "content_civiurl") {
      document.dispatchEvent(new CustomEvent('page_civiurl', {detail: request}));
    }
    if (request.action == "content_setstatus") {
      document.dispatchEvent(new CustomEvent('page_setstatus', {detail : request}));
    }
  }
);

// Event listener for page
document.addEventListener('content_gmailapi', function(e) {
  var detail = Object.assign({ 'action': 'gmailapi' }, e.detail);
  // send message to background
  chrome.runtime.sendMessage(detail, function(response) {
    console.log('gmailapi response', response);
  });
});

// Event listener for page
document.addEventListener('content_civiurl', function(e) {
  var detail = Object.assign({ 'action': 'civiurl' }, e.detail);
  // send message to background
  chrome.runtime.sendMessage(detail, function(response) {
    console.log('civiurl response', response);
  });
});

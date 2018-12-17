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

var resetRecordButton = function(recordSentMail) {
  // &#9744; is empty checkbox; &#9745; is filled checkbox
  if (recordSentMail) {
    $('div.recsent_bttn_container > div').text(String.fromCharCode(9745) + ' Record Sent Mails');
  } else {
    $('div.recsent_bttn_container > div').text(String.fromCharCode(9744) + ' Record Sent Mails');
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

// Event listener for page
document.addEventListener('record_sent_mail', function(e) {
  var action = e.detail.action;
  chrome.storage.sync.get({
    "civiRecordSentMail": false
  }, function (rec) {
    if (action == 'toggle') {
      var value = !rec.civiRecordSentMail;
      chrome.storage.sync.set({
        civiRecordSentMail: value
      }, function() {
        resetRecordButton(value);
      });
    } else if (action == 'get') {
      resetRecordButton(rec.civiRecordSentMail);
    }
  });
});

// listen to background
chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {
    if (request.action == "content_resetbuttons") {
      var token = request.token;
      resetButtons(token);
      document.dispatchEvent(new CustomEvent('record_sent_mail', {detail: {'action' : 'get'}}));
    }
    if (request.action == "content_civiurl") {
      document.dispatchEvent(new CustomEvent('page_civiurl', {detail: request}));
    }
    if (request.action == "content_setstatus") {
      document.dispatchEvent(new CustomEvent('page_setstatus', {detail : request}));
    }
    if (request.action == "content_getgroups") {
      // Before returning the groups, also look up the currently selected groups (if any)
      chrome.storage.sync.get({
        "civiSelectedGroups": []
      }, function (sel) {
        var dtl = Object.assign({ 'selected': sel.civiSelectedGroups }, request);
        document.dispatchEvent(new CustomEvent('page_getgroups', { detail: dtl }));
      });
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
  if (detail.email_id) {
    // send message to background
    chrome.runtime.sendMessage(detail, function(response) {
      console.log('civiurl response', response);
    });
  } else {
    // If this is a sent mail, check if we're supposed to record it
    chrome.storage.sync.get({
      "civiRecordSentMail": false
    }, function (rec) {
      if (rec.civiRecordSentMail) {
        // send message to background
        chrome.runtime.sendMessage(detail, function(response) {
          console.log('civiurl response', response);
        });
      }
    });
  }
});

// Event listener for page
document.addEventListener('content_civigroups', function(e) {
  var detail = Object.assign({ 'action': 'civigroups' }, e.detail);
  // send message to background
  chrome.runtime.sendMessage(detail, function(response) {
    console.log('civigroups response', response);
  });
});

// Event listener for page
document.addEventListener('content_selectedgroup', function(e) {
  if ('group' in e.detail) {  // set to the provided groups
    chrome.storage.sync.set({
      civiSelectedGroups: e.detail.group
    }, function() {
    });
  } else {  // get the saved value
    chrome.storage.sync.get({
      "civiSelectedGroups": []
    }, function(grp) {
      if (grp.civiSelectedGroups.length > 0) {
        document.dispatchEvent(new CustomEvent('page_selectedgroup', { detail: { selected: grp.civiSelectedGroups } }));
      }
    });
  }
});

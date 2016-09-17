//oauth2 auth
chrome.identity.getAuthToken(
  {'interactive': true},
  function(gToken){
    //load Google's javascript client libraries
    window.gapi_onload = authorize;
    loadScript('https://apis.google.com/js/client.js');
    localStorage['gtoken'] = gToken;
    console.log('getAuthToken=');
    console.log(gToken);
    console.log(localStorage);
  }
);

function loadScript(url){
  var request = new XMLHttpRequest();

  request.onreadystatechange = function(){
    if(request.readyState !== 4) {
      return;
    }

    if(request.status !== 200){
      return;
    }

    //console.log(request.responseText);
    eval(request.responseText);
  };

  request.open('GET', url);
  request.send();
}

function authorize(){
  gapi.auth.authorize(
    {
      client_id: '721138563269-4s8dv4crl8869lfkgqrb51mj77u77ojc.apps.googleusercontent.com',
      immediate: true,
      scope: ['https://mail.google.com', 'https://www.googleapis.com/auth/gmail.modify','https://www.googleapis.com/auth/gmail.readonly']
    },
    function(){
      var gToken = localStorage['gtoken'];
      console.log('gToken from cache=' + gToken);
      //console.log(gToken);
      //gapi.client.setApiKey(gToken);
      //gapi.client.setApiKey("AIzaSyACRHUNS5qcL-Q-aYqx6LQCqthC96lFEnM");
      //gapi.auth.setToken({access_token: gToken});
      //gapi.client.load('gmail', 'v1', listLabels);
      get({
        'url': 'https://www.googleapis.com/gmail/v1/users/me/labels',
        'callback': someCallback,
        'token': gToken,
      });
      get({
        'url': 'https://www.googleapis.com/gmail/v1/users/me/messages/15728f981f39146a',// + '?key=' + 'AIzaSyACRHUNS5qcL-Q-aYqx6LQCqthC96lFEnM',
        'callback': someCallback,
        'token': gToken,
      });
    }
  );
}


function someCallback(label) {
  console.log("label callback");
  console.log(label);
}

function listLabels() {
  var request = gapi.client.gmail.users.labels.list({
    'userId': 'me'
  });

  request.execute(function(resp) {
    var labels = resp.labels;
    console.log('Labels:');

    if (labels && labels.length > 0) {
      for (i = 0; i < labels.length; i++) {
        var label = labels[i];
        console.log(label.name)
      }
    } else {
      console.log('No Labels found.');
    }
  });
}


var oConfig = {
  CLIENT_ID: "client123id",
  CLIENT_SECRET: "client123id",
  SCOPE: 'gmail_extension',
  REDIRECT_URI: 'https://oocdkbejkcafojlbdpkpmffejenhpkfb.chromiumapp.org/' // fixme: auto generate it
}
var ACCESS_TOKEN_PREFIX = '#access_token=';
var ACCESS_TOKEN_STORAGE_KEY = 'outlook-access-token';

var setAccessToken = function(accessToken) {
  localStorage[ACCESS_TOKEN_STORAGE_KEY] = accessToken;
}
var getAccessToken = function() {
  var token = localStorage[ACCESS_TOKEN_STORAGE_KEY];
  console.log('getAccessToken result = ' + token);
  return token;
}
var clearAccessToken = function() {
  localStorage.removeItem(ACCESS_TOKEN_STORAGE_KEY)
}

launchAuthorizer = function() {
  console.log("Trying to login for oauth.");
  oauthUrl = "https://mailchimp.vedaconsulting.co.uk/oauth2/authorize?" + $.param({
    "client_id": oConfig.CLIENT_ID,
    "scope": oConfig.SCOPE,
    "redirect_uri": oConfig.REDIRECT_URI,
    "response_type":"token",
    "state" : 'null',
    "access_type":"offline",
    "login_hint":'welldeepak@gmail.com',
    "prompt":"consent"
  });
  console.log(oauthUrl);
  chrome.identity.launchWebAuthFlow(
    {"url": oauthUrl, "interactive": true},
    function(code) {
      console.log('auth code= ' + code);
      var accessTokenStart = code.indexOf(ACCESS_TOKEN_PREFIX);
      if (accessTokenStart < 0) {
        console.log('Unexpected code: ' + code);
        accessToken = false;//false
      } else {
        var accessToken = code.substring(accessTokenStart + ACCESS_TOKEN_PREFIX.length);
        setAccessToken(accessToken);
      }
      console.log('access token= ' + accessToken);
      // send message to content
      chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        chrome.tabs.sendMessage(tabs[0].id, {action: 'post_webauthflow',token: accessToken}, function(response) {});
      });
    }
  );
}

// listen from content
chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {
    if (request.action == "reconnect") {
      var token;
      token = getAccessToken();
      if (request.action == "reconnect" && request.button == 'Connect Outlook') {
        if (!token) {
          launchAuthorizer();
          // sendresponse assuming successfull. Post launch content would be notified anyway
          sendResponse({'token': true});
        } else {
          sendResponse({'token': token});
        }
      } else if (request.action == "reconnect" && request.button == 'Disconnect Outlook') {
        clearAccessToken();
        token = getAccessToken();
        sendResponse({'token': token});
      }
    }
    else if (request.action == "gmailapi") {
      console.log('background gmail api listner');
      var gToken = localStorage['gtoken'];
      console.log('gToken from cache=');
      console.log(gToken);
      if (request.email_id) {
        get({
          'url': 'https://www.googleapis.com/gmail/v1/users/me/messages/' + request.email_id,
          'callback': getMessage,
          'callbackParams' : request,
          //FIXME: token retrieval to be done during xhr call
          'token': gToken,
        });
      }
      //else {
      //  get({
      //    'url': 'https://www.googleapis.com/gmail/v1/users/me/labels',
      //    'callback': someCallback,
      //    'token': gToken,
      //  });
      //}
    }
  }
);

function getMessage(message, params) {
  var gToken = localStorage['gtoken'];
  console.log('gToken from cache=');
  console.log(gToken);
  console.log("getMessage callback");
  console.log(message);
  var parts = message.payload.parts;
  for (var i = 0; i < parts.length; i++) {
    var part = parts[i];
    if (part.filename && part.filename.length > 0) {
      var attachId = part.body.attachmentId;
      console.log("attachId = " + attachId);
      //params.email_attachment.filename = part.filename;
      //params.email_attachment.mimeType = part.mimeType;
      params.filename = part.filename;
      params.mimeType = part.mimeType;
      get({
        'url': 'https://www.googleapis.com/gmail/v1/users/me/messages/' + message.id + '/attachments/' + attachId,
        'callback': getAttachment,
        'callbackParams' : params,
        'token': gToken,
      });
      //var request = gapi.client.gmail.users.messages.attachments.get({
      //  'id': attachId,
      //    'messageId': message.id,
      //    'userId': userId
      //});
      //request.execute(function(attachment) {
      //  callback(part.filename, part.mimeType, attachment);
      //});
    }
  }
}

function getAttachment(attachment, params) {
  var formData = new FormData();

  formData.append('email', params.email);
  formData.append('subject', params.subject);
  formData.append('email_body', params.email_body);
  formData.append('ot_target_contact_id', params.ot_target_contact_id);
  //formData.append('email_attachment[0][name]', params.email_attachment[0]);

  console.log('attachment=');
  console.log(attachment);
  console.log('params=');
  console.log(params);
  
  //attachment = attachment.data;
  //params.email_attachment.tmp_name = attachment.data;
  //formData.append('somename[]', 'file', params.email_attachment.filename);
  //formData.append('file[]', attachment.data);
  formData.append('somename[]', new Blob([attachment.data], {type: params.mimetype}), params.filename);
  //formData.append('file[]', new Blob([attachment.data], {type: params.mimetype}), params.filename);
  //var binary = atob(attachment.replace(/-/g, '+').replace(/_/g, '/'));
  //console.log(binary);

  $.ajax({
    type: "POST",
    url: 'https://mailchimp.vedaconsulting.co.uk/civicrm/gmail/logactivity',
    crossDomain: true,
    //contentType: 'image/png',
    //contentType: 'multipart/form-data',
    //contentType: 'application/x-www-form-urlencoded',
    //contentType: params.email_attachment.mimeType,
    contentType: false,
    processData: false,
    data: formData,
    success: function (data, textStatus ) {
      console.log(textStatus);
    },
  });
}

/**
 * Make an authenticated HTTP GET request.
 *
 * @param {object} options
 *   @value {string} url - URL to make the request to. Must be whitelisted in manifest.json
 *   @value {string} token - Google access_token to authenticate request with.
 *   @value {function} callback - Function to receive response.
 */
function get(options) {
  var xhr = new XMLHttpRequest();
  xhr.onreadystatechange = function() {
    if (xhr.readyState === 4 && xhr.status === 200) {
      // JSON response assumed. Other APIs may have different responses.
      options.callback(JSON.parse(xhr.responseText), options.callbackParams);
    } else {
      console.log('get', xhr.readyState, xhr.status, xhr.responseText);
    }
  };
  xhr.open("GET", options.url, true);
  // Set standard Google APIs authentication header.
  xhr.setRequestHeader('Authorization', 'Bearer ' + options.token);
  console.log("xhr call: " + options.url)
  xhr.send();
}

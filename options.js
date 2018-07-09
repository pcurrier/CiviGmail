// Saves options to chrome.storage
function save_options() {
  var civiUrl = document.getElementById('civiUrl').value;
  var civiApiKey = document.getElementById('civiApiKey').value;
  var civioAuthUrl = document.getElementById('civioAuthUrl').value;
  var civioAuthSec = document.getElementById('civioAuthSec').value;
  chrome.storage.sync.set({
    civiUrl: civiUrl,
    civiApiKey: civiApiKey,
    civioAuthUrl: civioAuthUrl,
    civioAuthSec: civioAuthSec
  }, function() {
    // Update status to let user know options were saved.
    var status = document.getElementById('status');
    status.textContent = 'Options saved.';
    setTimeout(function() {
      status.textContent = '';
    }, 1000);
  });
}

// Restores select box and checkbox state using the preferences
// stored in chrome.storage.
function restore_options() {
  // Use default value color = 'red' and likesColor = true.
  chrome.storage.sync.get({
    civiUrl: 'https://example.org/civicrm',
    civiApiKey: '',
    civioAuthUrl: 'https://example.org/oauth2/authorize',
    //civiUrl: 'https://mailchimp.vedaconsulting.co.uk/civicrm',
    //civioAuthUrl: 'https://mailchimp.vedaconsulting.co.uk/oauth2/authorize',
    civioAuthSec: '228ffe6c8b4e_4681d6c869_f8bbf6cd43'
  }, function(items) {
    document.getElementById('civiUrl').value = items.civiUrl;
    document.getElementById('civiApiKey').value = items.civiApiKey;
    document.getElementById('civioAuthUrl').value = items.civioAuthUrl;
    document.getElementById('civioAuthSec').value = items.civioAuthSec;
  });
}
document.addEventListener('DOMContentLoaded', restore_options);
document.getElementById('save').addEventListener('click', save_options);

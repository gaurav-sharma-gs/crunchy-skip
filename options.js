const defaults = { enabled: true, skipIntro: true, skipEnding: true, clickDelayMs: 200, debug: false };

function $(id) { return document.getElementById(id); }

function load() {
  if (chrome && chrome.storage && chrome.storage.sync) {
    chrome.storage.sync.get(defaults, (res) => {
      $('enabled').checked = res.enabled;
      $('skipIntro').checked = res.skipIntro;
      $('skipEnding').checked = res.skipEnding;
      $('debug').checked = res.debug;
      $('clickDelayMs').value = res.clickDelayMs;
    });
  } else {
    $('enabled').checked = defaults.enabled;
    $('skipIntro').checked = defaults.skipIntro;
    $('skipEnding').checked = defaults.skipEnding;
    $('debug').checked = defaults.debug;
    $('clickDelayMs').value = defaults.clickDelayMs;
  }
}

function save() {
  const val = {
    enabled: $('enabled').checked,
    skipIntro: $('skipIntro').checked,
    skipEnding: $('skipEnding').checked,
    debug: $('debug').checked,
    clickDelayMs: parseInt($('clickDelayMs').value || 0, 10)
  };
  chrome.storage.sync.set(val, () => {
    alert('Options saved');
  });
}

function resetDefaults() {
  chrome.storage.sync.set(defaults, () => {
    load();
    alert('Reset to defaults');
  });
}

document.addEventListener('DOMContentLoaded', () => {
  load();
  $('save').addEventListener('click', save);
  $('reset').addEventListener('click', resetDefaults);
});

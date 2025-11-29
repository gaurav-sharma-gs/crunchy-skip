// settingsManager.js - Settings and storage management for Crunchy-Skip

const defaults = {
  enabled: true,
  skipIntro: true,
  skipEnding: true,
  clickDelayMs: 200,
  debug: false,
  pipEnabled: true
};

let settings = { ...defaults };

function getApplyFunction() {
  // Use the latest exposed applySettings (which the orchestrator wraps) when available
  if (typeof window !== 'undefined' && window.__cr_settings?.applySettings) {
    return window.__cr_settings.applySettings;
  }
  return applySettings;
}

function getSyncStorage() {
  if (typeof chrome === 'undefined' || !chrome.storage) return null;
  return chrome.storage.sync || chrome.storage.local || null;
}

function applySettings(nextSettings) {
  const sanitized = {
    enabled: nextSettings.enabled !== false,
    skipIntro: nextSettings.skipIntro !== false,
    skipEnding: nextSettings.skipEnding !== false,
    clickDelayMs: Number.isFinite(nextSettings.clickDelayMs) ? nextSettings.clickDelayMs : defaults.clickDelayMs,
    debug: Boolean(nextSettings.debug),
    pipEnabled: nextSettings.pipEnabled !== false
  };

  settings = { ...defaults, ...sanitized };

  logDebug('Settings applied', settings);

  // Notify dependent modules
  try {
    window.__cr_skipDetection?.handleSettingsChange?.(settings);
  } catch (err) {
    console.warn('crunchy-skip: skip detection update failed', err);
  }

  try {
    if (settings.pipEnabled) {
      window.__cr_pip?.start?.();
    } else {
      window.__cr_pip?.stop?.();
    }
  } catch (err) {
    console.warn('crunchy-skip: PiP update failed', err);
  }
  
  return settings;
}

function loadSettings() {
  const storage = getSyncStorage();
  if (!storage) {
    applySettings(defaults);
    return;
  }

  try {
    storage.get(defaults, (items) => {
      if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.lastError) {
        console.warn('crunchy-skip: using defaults due to storage error', chrome.runtime.lastError);
        applySettings(defaults);
        return;
      }
      const apply = getApplyFunction();
      apply(items || defaults);
    });
  } catch (err) {
    console.warn('crunchy-skip: storage unavailable, using defaults', err);
    applySettings(defaults);
  }
}

function listenForSettingChanges() {
  if (typeof chrome === 'undefined' || !chrome.storage || !chrome.storage.onChanged) return;
  chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName !== 'sync' && areaName !== 'local') return;
    const delta = { ...settings };
    let changed = false;
    for (const key of Object.keys(changes)) {
      if (key in defaults) {
        delta[key] = changes[key].newValue;
        changed = true;
      }
    }
    if (changed) {
      const apply = getApplyFunction();
      apply(delta);
    }
  });
}

function updateSetting(key, value) {
  const storage = getSyncStorage();
  if (storage) {
    storage.set({ [key]: value }, () => {
      if (chrome.runtime && chrome.runtime.lastError) {
        console.warn('crunchy-skip: failed to persist setting', chrome.runtime.lastError);
      }
    });
  }
}

function getSetting(key) {
  return settings[key];
}

// Make functions available globally for other modules
if (typeof window !== 'undefined') {
  window.__cr_settings = {
    defaults,
    getSettings: () => ({ ...settings }),
    getSetting,
    updateSetting,
    applySettings: (newSettings) => applySettings(newSettings),
    loadSettings,
    listenForSettingChanges
  };
}

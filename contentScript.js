// crunchy-skip - production-ready content script
// Automatically clicks Crunchyroll's "Skip Intro" / "Skip Credits" buttons when available.

const defaults = {
  enabled: true,
  skipIntro: true,
  skipEnding: true,
  clickDelayMs: 200,
  debug: false
};

const CLICK_DEBOUNCE_MS = 1200;
const FALLBACK_SCAN_MS = 10000;
const CANDIDATE_SELECTOR = [
  'button',
  '[role="button"]',
  'a[role="button"]',
  '[aria-label*="skip" i]',
  '[data-testid*="skip" i]'
].join(', ');

const introKeywords = [
  /skip intro/i,
  /skip recap/i
];

const endingKeywords = [
  /skip credits/i,
  /skip preview/i
];

let settings = { ...defaults };
let lastClickAt = 0;
let fallbackHandle = null;
let observerActive = false;
let mutationScheduled = false;
const clickedTargets = new WeakSet();

function logDebug(...args) {
  if (!settings.debug) return;
  console.debug('crunchy-skip:', ...args);
}

function normalizeText(value) {
  return (value || '').trim().replace(/\s+/g, ' ').toLowerCase();
}

function safeClick(el) {
  if (!el) return false;
  try {
    el.click();
    logDebug('Clicked element via native click');
    return true;
  } catch (err) {
    logDebug('Native click failed, dispatching MouseEvent', err);
    try {
      const ev = new MouseEvent('click', { bubbles: true, cancelable: true, view: window });
      el.dispatchEvent(ev);
      return true;
    } catch (err2) {
      console.warn('crunchy-skip: failed to click element', err2);
      return false;
    }
  }
}

function canClickNow() {
  return Date.now() - lastClickAt > CLICK_DEBOUNCE_MS;
}

function collectLabelStrings(el) {
  if (!el) return [];
  const strings = new Set();
  const add = (value) => {
    if (value) strings.add(value);
  };

  const attr = (name) => (el.getAttribute && el.getAttribute(name)) || '';

  add(attr('aria-label'));
  add(attr('title'));
  add(attr('data-testid'));
  add(el.dataset && el.dataset.testid);

  const labelledBy = attr('aria-labelledby');
  if (labelledBy) {
    labelledBy.split(/\s+/).forEach((id) => {
      const labelEl = document.getElementById(id);
      if (labelEl) add(labelEl.innerText || labelEl.textContent || '');
    });
  }

  add(el.innerText || el.textContent || '');

  return Array.from(strings);
}

function matchKeywords(sourceStrings, keywords) {
  for (const value of sourceStrings) {
    const normalized = normalizeText(value);
    if (!normalized) continue;
    for (const regex of keywords) {
      if (regex.test(normalized)) return true;
    }
  }
  return false;
}

function classifyButton(el) {
  if (!el) return null;
  const labels = collectLabelStrings(el);
  if (!labels.length) return null;
  if (matchKeywords(labels, introKeywords)) return 'intro';
  if (matchKeywords(labels, endingKeywords)) return 'ending';
  return null;
}

function shouldClick(type) {
  return (type === 'intro' && settings.skipIntro) || (type === 'ending' && settings.skipEnding);
}

function getCandidateElements() {
  return document.querySelectorAll(CANDIDATE_SELECTOR);
}

function scheduleScan(reason) {
  if (!settings.enabled) return;
  if (mutationScheduled) return;
  mutationScheduled = true;
  requestAnimationFrame(() => {
    mutationScheduled = false;
    scanAndClick(reason);
  });
}

function scanAndClick(reason = 'manual') {
  if (!settings.enabled) return false;

  const candidates = Array.from(getCandidateElements());
  logDebug(`Scanning ${candidates.length} candidate elements`, { reason });

  for (const el of candidates) {
    if (!el.isConnected) continue;
    if (clickedTargets.has(el)) continue;

    const kind = classifyButton(el);
    if (!kind || !shouldClick(kind)) continue;
    if (!canClickNow()) continue;

    const delay = Math.max(0, Number.isFinite(settings.clickDelayMs) ? settings.clickDelayMs : defaults.clickDelayMs);
    clickedTargets.add(el);
    lastClickAt = Date.now();
    setTimeout(() => safeClick(el), delay);
    logDebug(`Scheduled ${kind} click`, { delay, reason });
    return true;
  }

  scheduleFallbackScan();
  return false;
}

const observer = new MutationObserver(() => scheduleScan('mutation'));

function startObserving() {
  if (observerActive) return;
  const root = document.body || document.documentElement;
  if (!root) return;
  observer.observe(root, {
    childList: true,
    subtree: true,
    attributes: true,
    characterData: true
  });
  observerActive = true;
  logDebug('Mutation observer started');
}

function stopObserving() {
  if (!observerActive) return;
  observer.disconnect();
  observerActive = false;
}

function scheduleFallbackScan() {
  if (!settings.enabled) return;
  if (fallbackHandle) {
    clearTimeout(fallbackHandle);
    fallbackHandle = null;
  }
  fallbackHandle = setTimeout(() => {
    fallbackHandle = null;
    if (!settings.enabled) return;
    scheduleScan('fallback');
    scheduleFallbackScan();
  }, FALLBACK_SCAN_MS);
}

function stopFallbackScan() {
  if (!fallbackHandle) return;
  clearTimeout(fallbackHandle);
  fallbackHandle = null;
}

function applySettings(nextSettings) {
  const sanitized = {
    enabled: nextSettings.enabled !== false,
    skipIntro: nextSettings.skipIntro !== false,
    skipEnding: nextSettings.skipEnding !== false,
    clickDelayMs: Number.isFinite(nextSettings.clickDelayMs) ? nextSettings.clickDelayMs : defaults.clickDelayMs,
    debug: Boolean(nextSettings.debug)
  };

  settings = { ...defaults, ...sanitized };

  if (settings.enabled) {
    startObserving();
    scheduleScan('settings');
    scheduleFallbackScan();
  } else {
    stopObserving();
    stopFallbackScan();
  }

  logDebug('Settings applied', settings);
}

function getSyncStorage() {
  if (typeof chrome === 'undefined' || !chrome.storage) return null;
  return chrome.storage.sync || chrome.storage.local || null;
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
      applySettings(items || defaults);
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
      applySettings(delta);
    }
  });
}

loadSettings();
listenForSettingChanges();

if (typeof window !== 'undefined') {
  window.__cr_autoskip = {
    forceScan: () => scanAndClick('manual'),
    get settings() {
      return { ...settings };
    },
    findCandidates: () => Array.from(getCandidateElements()).filter((el) => classifyButton(el))
  };
}

logDebug('Content script initialized');

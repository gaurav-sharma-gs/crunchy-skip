// keyboardShortcut.js - Keyboard shortcut handling for Crunchy-Skip

function getSyncStorage() {
  if (typeof chrome === 'undefined' || !chrome.storage) return null;
  return chrome.storage.sync || chrome.storage.local || null;
}

function logDebug(...args) {
  const settings = window.__cr_settings?.getSettings();
  if (!settings?.debug) return;
  console.debug('crunchy-skip:', ...args);
}

function handleKeyboardShortcut(event) {
  // Alt+Shift+S shortcut to toggle auto-skip
  // Use event.code for cross-platform compatibility
  // event.code represents the physical key position, not the character
  const isSKey = event.code === 'KeyS';
  
  if (event.altKey && event.shiftKey && isSKey && !event.ctrlKey && !event.metaKey) {
    event.preventDefault();
    event.stopPropagation();
    
    const currentSettings = window.__cr_settings?.getSettings();
    const newEnabled = !currentSettings?.enabled;
    const storage = getSyncStorage();
    
    if (storage) {
      storage.set({ enabled: newEnabled }, () => {
        if (chrome.runtime && chrome.runtime.lastError) {
          console.warn('crunchy-skip: failed to persist shortcut toggle', chrome.runtime.lastError);
        } else {
          window.__cr_feedback?.showStatus?.(newEnabled) ||
            window.__cr_feedback?.showInfo(`crunchy-skip: Auto-skip ${newEnabled ? 'enabled' : 'disabled'}`);
        }
      });
    } else {
      // Fallback if storage is not available
      window.__cr_settings?.applySettings({ enabled: newEnabled });
      window.__cr_feedback?.showStatus?.(newEnabled) ||
        window.__cr_feedback?.showInfo(`Crunchy-Skip: Auto-skip ${newEnabled ? 'Enabled' : 'Disabled'}`);
    }
  }
}

function addKeyboardListeners() {
  // Add multiple listeners to ensure we catch the event
  document.addEventListener('keydown', handleKeyboardShortcut, true);
  window.addEventListener('keydown', handleKeyboardShortcut, true);
  
  // Also try capture phase on document
  document.addEventListener('keydown', handleKeyboardShortcut, { capture: true });
  
  logDebug('Keyboard shortcut listeners added (Alt+Shift+S)');
}

// Make functions available globally
if (typeof window !== 'undefined') {
  window.__cr_keyboard = {
    addKeyboardListeners
  };
}

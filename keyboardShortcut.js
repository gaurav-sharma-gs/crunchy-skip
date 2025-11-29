// keyboardShortcut.js - Keyboard shortcut handling for Crunchy-Skip

function getSyncStorage() {
  if (typeof chrome === 'undefined' || !chrome.storage) return null;
  return chrome.storage.sync || chrome.storage.local || null;
}

function isExtensionContextValid() {
  return typeof chrome !== 'undefined' && !!(chrome.runtime && chrome.runtime.id);
}

function logDebug(...args) {
  const settings = window.__cr_settings?.getSettings();
  if (!settings?.debug) return;
  console.debug('crunchy-skip:', ...args);
}

function handleKeyboardShortcut(event) {
  // Alt+Shift+S toggles auto-skip, Alt+Shift+P toggles PiP
  // Use event.code for cross-platform compatibility
  // event.code represents the physical key position, not the character
  const isSKey = event.code === 'KeyS';
  const isPKey = event.code === 'KeyP';
  
  if (event.altKey && event.shiftKey && (isSKey || isPKey) && !event.ctrlKey && !event.metaKey) {
    event.preventDefault();
    event.stopPropagation();
    
    if (isPKey) {
      try {
        window.__cr_pip?.toggle?.();
      } catch (err) {
        console.warn('crunchy-skip: PiP toggle failed', err);
      }
      return;
    }

    const currentSettings = window.__cr_settings?.getSettings?.();
    const newValue = !currentSettings?.enabled;
    const storage = isExtensionContextValid() ? getSyncStorage() : null;
    
    if (storage) {
      try {
        storage.set({ enabled: newValue }, () => {
          if (chrome.runtime && chrome.runtime.lastError) {
            console.warn('crunchy-skip: failed to persist shortcut toggle', chrome.runtime.lastError);
          } else {
            window.__cr_feedback?.showStatus?.(newValue) ||
              window.__cr_feedback?.showInfo?.(`crunchy-skip: Auto-skip ${newValue ? 'enabled' : 'disabled'}`);
          }
        });
      } catch (err) {
        console.warn('crunchy-skip: storage set failed (shortcut)', err);
        window.__cr_settings?.applySettings?.({ enabled: newValue });
        window.__cr_feedback?.showStatus?.(newValue) ||
          window.__cr_feedback?.showInfo?.(`crunchy-skip: Auto-skip ${newValue ? 'enabled' : 'disabled'}`);
      }
    } else {
      window.__cr_settings?.applySettings?.({ enabled: newValue });
      window.__cr_feedback?.showStatus?.(newValue) ||
        window.__cr_feedback?.showInfo?.(`crunchy-skip: Auto-skip ${newValue ? 'enabled' : 'disabled'}`);
    }
  }
}

function addKeyboardListeners() {
  // Add multiple listeners to ensure we catch the event
  document.addEventListener('keydown', handleKeyboardShortcut, true);
  window.addEventListener('keydown', handleKeyboardShortcut, true);
  
  // Also try capture phase on document
  document.addEventListener('keydown', handleKeyboardShortcut, { capture: true });
  
  logDebug('Keyboard shortcut listeners added (Alt+Shift+S / Alt+Shift+P)');
}

// Make functions available globally
if (typeof window !== 'undefined') {
  window.__cr_keyboard = {
    addKeyboardListeners
  };
}

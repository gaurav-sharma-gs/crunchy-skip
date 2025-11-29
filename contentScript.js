// contentScript.js - Main entry point for Crunchy-Skip extension
// Orchestrates all modules and provides the public API

// Module loading is handled by the manifest.json in order:
// 1. settingsManager.js - Settings and storage
// 2. skipDetection.js - Core skip detection logic
// 3. visualFeedback.js - Visual feedback system
// 4. keyboardShortcut.js - Keyboard shortcuts
// 5. contentScript.js - Main orchestrator

function logDebug(...args) {
  const settings = window.__cr_settings?.getSettings();
  if (!settings?.debug) return;
  console.debug('crunchy-skip:', ...args);
}

function initializeExtension() {
  logDebug('Content script initializing...');
  
  // Wait for all modules to be available
  const checkModules = () => {
    if (window.__cr_settings && window.__cr_skipDetection && 
        window.__cr_feedback && window.__cr_keyboard) {
      
      try {
        // Initialize settings system first
        window.__cr_settings.loadSettings();
        window.__cr_settings.listenForSettingChanges();
        
        // Set up proper settings change callback to notify skip detection
        const originalApplySettings = window.__cr_settings.applySettings;
        window.__cr_settings.applySettings = function(newSettings) {
          const result = originalApplySettings.call(this, newSettings);
          // Notify skip detection module
          if (window.__cr_skipDetection && window.__cr_skipDetection.handleSettingsChange) {
            window.__cr_skipDetection.handleSettingsChange(result);
          }
          // Toggle PiP UI based on setting
          if (result?.pipEnabled) {
            window.__cr_pip?.start?.();
          } else {
            window.__cr_pip?.stop?.();
          }
          return result;
        };
        
        // Start keyboard listeners
        window.__cr_keyboard.addKeyboardListeners();

        // Start the Picture-in-Picture button if enabled
        if (window.__cr_settings?.getSettings?.().pipEnabled) {
          window.__cr_pip?.start?.();
        }
        
        logDebug('Content script initialized successfully');
      } catch (error) {
        console.error('crunchy-skip: Initialization error:', error);
        // Retry after a delay
        setTimeout(checkModules, 500);
      }
    } else {
      // Retry if modules aren't ready yet
      setTimeout(checkModules, 100);
    }
  };
  
  checkModules();
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeExtension);
} else {
  initializeExtension();
}

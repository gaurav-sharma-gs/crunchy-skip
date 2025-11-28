Crunchy-Skip
============

[![Chrome Web Store – Crunchy-Skip](https://img.shields.io/chrome-web-store/v/gkkblgjjgfbddmpaehhicpfaapiepopj?label=Chrome%20Web%20Store%20%E2%80%93%20Crunchy-Skip&logo=google-chrome&logoColor=white)](https://chromewebstore.google.com/detail/crunchy-skip/gkkblgjjgfbddmpaehhicpfaapiepopj)


Chrome extension that automatically clicks Crunchyroll's "Skip Intro" and "Skip Credits" controls as soon as they appear.

Features
--------
- **Automatic skip** – detects skip intro/credits UI via aria-labels, titles, `data-testid`, `aria-labelledby`, and visible text.
- **All frames covered** – content script runs in every Crunchyroll frame, so embedded players are handled.
- **Immediate controls** – toolbar popup lets you enable/disable, toggle intro/credits separately, tweak click delay, and turn on debug logging; changes save instantly.
- **Keyboard shortcut** – press `Alt+Shift+S` (or `Option+Shift+S`) on any Crunchyroll page to quickly toggle auto-skip on/off with visual feedback. Works on both Mac and Windows with all keyboard layouts.
- **Safe, debounced clicks** – guards against rapid repeats and falls back to dispatched mouse events if a native click fails.

Installation
------------
- **From the Chrome Web Store:** visit the link above and click **Add to Chrome**.
- **Unpacked:** go to `chrome://extensions`, enable **Developer mode**, choose **Load unpacked**, and select the `crunchy-skip` folder.

Usage & Configuration
---------------------
1. Pin the extension (optional) and click the toolbar icon to open the popup.
2. Use the **Enable auto skip** button to turn the feature on/off instantly.
3. **Keyboard shortcut**: Press `Alt+Shift+S` (or `Option+Shift+S`) on any Crunchyroll page to quickly toggle auto-skip. A notification will appear showing the current status.
4. Toggle **Skip Intro** and **Skip Credits** independently, adjust **Click delay (ms)**, and optionally enable **Debug logging** for console traces.
5. Settings persist immediately via `chrome.storage` and apply live to any open Crunchyroll tabs.

How It Works
------------
- A manifest v3 content script injects on all `*.crunchyroll.com` pages (all frames).
- The script scans for candidate buttons on DOM mutations and via a 1.5s periodic scan, classifies them by text/labels, and clicks with an optional delay (default 200ms).
- Debug mode logs actions prefixed with `crunchy-skip:` in the frame where playback occurs.

Quick Test Checklist
--------------------
1. Install (store or unpacked) and open a Crunchyroll episode.
2. In the player frame console, look for `crunchy-skip: Settings applied` if debug logging is enabled.
3. When the Skip UI appears, it should be clicked automatically (typically within 0–1.5s plus any configured delay).
4. If it fails, verify the extension is enabled in the popup, try increasing the click delay, and review debug logs.
5. Advanced: run `window.__cr_autoskip.forceScan()` in the player frame console to trigger an immediate scan.

Local / Dev Testing
--------------------
1. Enable **Developer mode** in `chrome://extensions` and load the unpacked folder (`crunchy-skip`).
2. In DevTools Console on the player iframe, enable debug logging via the popup and watch for `crunchy-skip:` logs.
3. Use `window.__cr_autoskip.forceScan()` to force a scan, or `window.__cr_autoskip.findCandidates()` to see what the script detects.
4. Adjust `contentScript.js` constants locally (e.g., `PERIODIC_SCAN_MS`, keyword arrays), then click **Reload** on the extensions page and refresh the Crunchyroll tab to retest.
5. If the popup UI changes, reload the extension so the new HTML/JS is picked up before testing.

Troubleshooting
---------------
- If Crunchyroll changes button text, update `introKeywords`/`endingKeywords` in `contentScript.js`.
- For slower/faster cadence, adjust `PERIODIC_SCAN_MS` (default 1500ms) but keep the debounce to avoid duplicate clicks.
- Always inspect logs in the actual player iframe; the parent page console won’t show frame-level logs.

Project Structure
-----------------
- `manifest.json` – MV3 manifest with all-frames content script and action popup.
- `popup.html` / `popup.js` – toolbar UI and live settings persistence.
- `contentScript.js` – main orchestrator that coordinates all modules.
- `settingsManager.js` – settings and storage management.
- `skipDetection.js` – core skip button detection and clicking logic.
- `keyboardShortcut.js` – keyboard shortcut handling (Alt+Shift+S).
- `visualFeedback.js` – notification and visual feedback system.
- `icons/` – extension icons.
- `privacy-policy.md` – privacy policy for the store listing.

Feedback & Requests
-------------------
- Bugs or feature requests: please file an issue on GitHub with a short description of the problem and the behavior you’d like.

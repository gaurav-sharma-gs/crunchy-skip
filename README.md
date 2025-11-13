crunchy-skip
============

Chrome extension that automatically clicks Crunchyroll's "Skip Intro" and "Skip Credits" controls the moment they appear.

Features
--------
- **Frame-aware detection** – content script now runs in every Crunchyroll frame, so player iframes are covered by default.
- **Robust matching** – buttons are identified via aria-labels, titles, `data-testid`, `aria-labelledby`, and visible text (English + common shorthand variations).
- **Debounced safe clicks** – defensive click helper prevents rapid repeat clicks and falls back to dispatched mouse events when needed.
- **Configurable UX** – options page lets users toggle intro/ending skips separately, tweak click delay, and enable console debugging.

Unpacked Installation
---------------------
1. Go to `chrome://extensions` in a Chromium-based browser.
2. Enable **Developer mode**.
3. Click **Load unpacked** and select the `crunchy-skip` directory.
4. Pin the extension if desired, then open a Crunchyroll episode to verify skipping occurs.

Publishing Checklist
--------------------
1. Update `version` in `manifest.json` before uploading a new package.
2. Run through the Quick Test Checklist (below) to validate skipping behaviour.
3. Zip the folder contents (without the parent directory) and upload to the Chrome Web Store dashboard.
4. Provide the README contents (or a subset) as the listing description and include the icons from `/icons`.

Configuration
-------------
- **Enable auto skip** – master toggle for the content script.
- **Skip Intro / Skip Credits** – control each action independently.
- **Click delay (ms)** – add a delay before triggering the click to accommodate slow UIs.
- **Debug logging** – when enabled, the content script emits detailed logs in the active frame's console.

Quick Test Checklist
--------------------
1. Load the extension unpacked.
2. Open DevTools on the Crunchyroll player iframe and check for `crunchy-skip: Settings applied` (only if debug logging is enabled).
3. Start playback and wait for the Skip UI: it should be clicked automatically within ~1.5s of appearing.
4. If it fails, temporarily raise the click delay, ensure the extension is enabled, and inspect console output (enable debug logging in Options for verbose traces).
5. Advanced: run `window.__cr_autoskip.forceScan()` in the iframe console to trigger an immediate scan, or inspect `window.__cr_autoskip.findCandidates()` for matched elements.

Troubleshooting
---------------
- Crunchyroll may change markup; update the keyword arrays in `contentScript.js` if new button text appears.
- If you need faster detection, tweak `PERIODIC_SCAN_MS` (default 1500ms) in the script, but keep the debounce in place to avoid duplicate clicks.
- Player UI issues are often iframe-related—verify the logs inside the actual video frame, not the parent page.

Project Structure
-----------------
- `manifest.json` – MV3 manifest (with `all_frames` enabled for the content script).
- `contentScript.js` – main detection and click logic.
- `options.html` / `options.js` – lightweight settings UI stored via `chrome.storage.sync`.
- `icons/` – extension icon set (16/48/128 px).
- `privacy-policy.md` – text of the privacy policy you can host on GitHub Pages or link directly in the Chrome Web Store listing.

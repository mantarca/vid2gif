// popup.js - Controls the popup UI and settings persistence

document.addEventListener('DOMContentLoaded', async () => {
  const fpsSelect = document.getElementById('fpsSelect');
  const widthSelect = document.getElementById('widthSelect');
  const colorSelect = document.getElementById('colorSelect');

  const fpsBadge = document.getElementById('fpsBadge');
  const widthBadge = document.getElementById('widthBadge');
  const colorBadge = document.getElementById('colorBadge');

  const btnQuickRecord = document.getElementById('btnQuickRecord');
  const btnOpenStudio = document.getElementById('btnOpenStudio');

  // Load saved preferences
  const stored = await chrome.storage.local.get(['fps', 'widthPreset', 'colors']);
  if (stored.fps) fpsSelect.value = stored.fps;
  if (stored.widthPreset !== undefined) widthSelect.value = stored.widthPreset;
  if (stored.colors) colorSelect.value = stored.colors;

  updateBadges();

  function updateBadges() {
    fpsBadge.textContent = `${fpsSelect.value} FPS`;
    widthBadge.textContent = widthSelect.value === '0' ? 'Orijinal' : `${widthSelect.value}px`;
    colorBadge.textContent = `${colorSelect.value} Renk`;
  }

  function savePreferences() {
    const settings = {
      fps: parseInt(fpsSelect.value, 10),
      widthPreset: parseInt(widthSelect.value, 10),
      colors: parseInt(colorSelect.value, 10)
    };
    chrome.storage.local.set(settings);
    updateBadges();
  }

  fpsSelect.addEventListener('change', savePreferences);
  widthSelect.addEventListener('change', savePreferences);
  colorSelect.addEventListener('change', savePreferences);

  // Open Studio with auto-start flag
  btnQuickRecord.addEventListener('click', () => {
    savePreferences();
    chrome.runtime.sendMessage({ action: 'OPEN_STUDIO', autoStart: true });
    window.close();
  });

  // Open Studio without auto-start
  btnOpenStudio.addEventListener('click', () => {
    savePreferences();
    chrome.runtime.sendMessage({ action: 'OPEN_STUDIO', autoStart: false });
    window.close();
  });
});

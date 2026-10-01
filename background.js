// vid2gif Background Service Worker (Manifest V3)

chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    // Set default configuration
    chrome.storage.local.set({
      fps: 10,
      widthPreset: 800,
      colors: 256,
      maxDuration: 0 // 0 means unlimited
    });
    console.log('vid2gif eklentisi başarıyla kuruldu.');
  }
});

// Message listener for opening studio or controlling operations
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'OPEN_STUDIO') {
    const studioUrl = chrome.runtime.getURL('studio/studio.html') + (message.autoStart ? '?autostart=1' : '');
    chrome.tabs.create({ url: studioUrl });
    sendResponse({ status: 'ok' });
  }
  return true;
});

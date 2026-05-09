// Background service worker — handles tab state and icon updates

chrome.runtime.onInstalled.addListener(() => {
  // Set default settings on install
  chrome.storage.sync.set({
    speed: 2,
    direction: 'down',
    pauseOnHover: true
  });
  console.log('ScrollMate installed.');
});

// Re-inject content script into SPA tabs when URL changes without a full reload
// This fixes sites like Myntra that navigate without triggering a full page load
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url && !tab.url.startsWith('chrome://')) {
    chrome.scripting.executeScript({
      target: { tabId },
      files: ['content.js']
    }).catch(() => {}); // silently ignore — double-injection guard in content.js handles it
  }
});

// Update extension icon badge when scrolling is active on a tab
chrome.runtime.onMessage.addListener((msg, sender) => {
  if (msg.action === 'setScrollingState') {
    const tabId = sender.tab?.id;
    if (!tabId) return;
    if (msg.scrolling) {
      chrome.action.setBadgeText({ text: '▶', tabId });
      chrome.action.setBadgeBackgroundColor({ color: '#00e5a0', tabId });
    } else {
      chrome.action.setBadgeText({ text: '', tabId });
    }
  }
});

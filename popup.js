// popup.js — controls the extension popup UI and communicates with content.js

const toggleBtn = document.getElementById('toggle-btn');
const btnLabel = document.getElementById('btn-label');
const statusDot = document.getElementById('status-dot');
const statusText = document.getElementById('status-text');
const speedSlider = document.getElementById('speed-slider');
const speedDisplay = document.getElementById('speed-display');
const dirDown = document.getElementById('dir-down');
const dirUp = document.getElementById('dir-up');
const hoverToggle = document.getElementById('hover-toggle');
const floatToggle = document.getElementById('float-toggle');
const showFloatBtn = document.getElementById('show-float-btn');

let isScrolling = false;

/* ─────────────────────────────────
   HELPER: send message to active tab
───────────────────────────────── */
async function sendToTab(message) {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab?.id) return null;
    try {
      return await chrome.tabs.sendMessage(tab.id, message);
    } catch (e) {
      // Content script not present (e.g. SPA navigation on Myntra) — inject it now and retry
      await chrome.scripting.executeScript({ target: { tabId: tab.id }, files: ['content.js'] });
      await new Promise(r => setTimeout(r, 100)); // brief wait for script to initialise
      return await chrome.tabs.sendMessage(tab.id, message);
    }
  } catch (e) {
    console.warn('ScrollMate: Could not reach content script.', e.message);
    return null;
  }
}

/* ─────────────────────────────────
   SYNC STATE FROM CONTENT SCRIPT
───────────────────────────────── */
async function syncState() {
  const state = await sendToTab({ action: 'getState' });
  if (!state) return;

  isScrolling = state.scrolling;
  updateToggleUI(isScrolling);

  speedSlider.value = state.speed;
  speedDisplay.textContent = `${state.speed} px/tick`;

  if (state.direction === 'up') {
    dirUp.classList.add('active');
    dirDown.classList.remove('active');
  } else {
    dirDown.classList.add('active');
    dirUp.classList.remove('active');
  }

  hoverToggle.checked = state.pauseOnHover;
  floatToggle.checked = state.visible;
}

function updateToggleUI(scrolling) {
  if (scrolling) {
    toggleBtn.classList.add('active');
    btnLabel.textContent = 'Stop Scrolling';
    statusDot.classList.add('active');
    statusText.textContent = 'Scrolling…';
  } else {
    toggleBtn.classList.remove('active');
    btnLabel.textContent = 'Start Scrolling';
    statusDot.classList.remove('active');
    statusText.textContent = 'Idle';
  }
}

/* ─────────────────────────────────
   EVENTS
───────────────────────────────── */
toggleBtn.addEventListener('click', async () => {
  const res = await sendToTab({ action: 'toggle' });
  if (res) {
    isScrolling = res.scrolling;
    updateToggleUI(isScrolling);
  }
});

speedSlider.addEventListener('input', async () => {
  const speed = parseInt(speedSlider.value);
  speedDisplay.textContent = `${speed} px/tick`;
  await sendToTab({ action: 'setSpeed', speed });
  chrome.storage.sync.set({ speed });
});

dirDown.addEventListener('click', async () => {
  dirDown.classList.add('active');
  dirUp.classList.remove('active');
  await sendToTab({ action: 'setDirection', direction: 'down' });
  chrome.storage.sync.set({ direction: 'down' });
});

dirUp.addEventListener('click', async () => {
  dirUp.classList.add('active');
  dirDown.classList.remove('active');
  await sendToTab({ action: 'setDirection', direction: 'up' });
  chrome.storage.sync.set({ direction: 'up' });
});

hoverToggle.addEventListener('change', async () => {
  await sendToTab({ action: 'setPauseOnHover', value: hoverToggle.checked });
  chrome.storage.sync.set({ pauseOnHover: hoverToggle.checked });
});

floatToggle.addEventListener('change', async () => {
  if (floatToggle.checked) {
    await sendToTab({ action: 'showButton' });
  } else {
    await sendToTab({ action: 'hideButton' });
    if (isScrolling) {
      isScrolling = false;
      updateToggleUI(false);
    }
  }
});

showFloatBtn.addEventListener('click', async () => {
  await sendToTab({ action: 'showButton' });
  floatToggle.checked = true;
  window.close(); // close popup so user can see the button
});

/* ─────────────────────────────────
   INIT — load saved settings then sync
───────────────────────────────── */
chrome.storage.sync.get(['speed', 'direction', 'pauseOnHover'], (saved) => {
  if (saved.speed) {
    speedSlider.value = saved.speed;
    speedDisplay.textContent = `${saved.speed} px/tick`;
    sendToTab({ action: 'setSpeed', speed: saved.speed });
  }
  if (saved.direction) {
    if (saved.direction === 'up') {
      dirUp.classList.add('active');
      dirDown.classList.remove('active');
    }
    sendToTab({ action: 'setDirection', direction: saved.direction });
  }
  if (saved.pauseOnHover !== undefined) {
    hoverToggle.checked = saved.pauseOnHover;
    sendToTab({ action: 'setPauseOnHover', value: saved.pauseOnHover });
  }
  syncState();
});

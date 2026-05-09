(() => {
  // Prevent double-injection
  if (window.__scrollMateInjected) return;
  window.__scrollMateInjected = true;

  /* ─────────────────────────────────────────
     STATE
  ───────────────────────────────────────── */
  let scrollInterval = null;
  let isPaused = false;
  let isHovering = false;
  let speed = 2; // px per tick
  let direction = 'down';
  let pauseOnHover = true;
  let floatingBtn = null;
  let isVisible = false;

  /* ─────────────────────────────────────────
     SCROLL ENGINE
  ───────────────────────────────────────── */
  function getScrollTarget() {
    // Walk up from the centre of the viewport to find the real scrollable container.
    // Needed for SPAs like Myntra where the page body doesn't scroll — an inner div does.
    const el = document.elementFromPoint(window.innerWidth / 2, window.innerHeight / 2);
    let node = el;
    while (node && node !== document.body) {
      const style = getComputedStyle(node);
      const overflowY = style.overflowY;
      if ((overflowY === 'auto' || overflowY === 'scroll') && node.scrollHeight > node.clientHeight) {
        return node;
      }
      node = node.parentElement;
    }
    return window; // fallback to window scroll
  }

  function startScrolling() {
    if (scrollInterval) stopScrolling();
    scrollInterval = setInterval(() => {
      if (isPaused || (pauseOnHover && isHovering)) return;
      const delta = direction === 'down' ? speed : -speed;
      const target = getScrollTarget();
      if (target === window) {
        window.scrollBy({ top: delta, behavior: 'instant' });
      } else {
        target.scrollTop += delta;
      }

      // Auto-stop at top or bottom
      let atBottom, atTop;
      if (target === window) {
        atBottom = (window.innerHeight + window.scrollY) >= document.body.scrollHeight - 5;
        atTop = window.scrollY <= 0;
      } else {
        atBottom = target.scrollTop + target.clientHeight >= target.scrollHeight - 5;
        atTop = target.scrollTop <= 0;
      }
      if ((direction === 'down' && atBottom) || (direction === 'up' && atTop)) {
        stopScrolling();
        updateButtonState(false);
      }
    }, 16); // ~60fps
  }

  function stopScrolling() {
    clearInterval(scrollInterval);
    scrollInterval = null;
  }

  function toggleScroll() {
    if (scrollInterval) {
      stopScrolling();
      updateButtonState(false);
    } else {
      startScrolling();
      updateButtonState(true);
    }
  }

  /* ─────────────────────────────────────────
     FLOATING BUTTON
  ───────────────────────────────────────── */
  function createFloatingButton() {
    if (floatingBtn) return;

    const wrapper = document.createElement('div');
    wrapper.id = '__scrollmate_wrapper__';
    wrapper.innerHTML = `
      <style>
        #__scrollmate_wrapper__ {
          position: fixed;
          bottom: 28px;
          right: 28px;
          z-index: 2147483647;
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 10px;
          font-family: 'Segoe UI', system-ui, sans-serif;
        }
        #__scrollmate_panel__ {
          background: #0f0f0f;
          border: 1px solid #2a2a2a;
          border-radius: 16px;
          padding: 14px 16px;
          display: none;
          flex-direction: column;
          gap: 12px;
          min-width: 200px;
          box-shadow: 0 8px 32px rgba(0,0,0,0.4);
          color: #e0e0e0;
        }
        #__scrollmate_panel__.visible {
          display: flex;
        }
        #__scrollmate_panel__ .sm-label {
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: #666;
          margin-bottom: 2px;
        }
        #__scrollmate_panel__ .sm-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
        }
        #__scrollmate_speed__ {
          -webkit-appearance: none;
          width: 100%;
          height: 4px;
          background: #2a2a2a;
          border-radius: 2px;
          outline: none;
        }
        #__scrollmate_speed__::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: 14px;
          height: 14px;
          background: #00e5a0;
          border-radius: 50%;
          cursor: pointer;
        }
        #__scrollmate_speed_val__ {
          font-size: 12px;
          color: #00e5a0;
          min-width: 24px;
          text-align: right;
          font-weight: 600;
        }
        #__scrollmate_dir__ {
          display: flex;
          gap: 6px;
        }
        #__scrollmate_dir__ button {
          flex: 1;
          background: #1a1a1a;
          border: 1px solid #333;
          color: #aaa;
          border-radius: 8px;
          padding: 5px 0;
          font-size: 12px;
          cursor: pointer;
          transition: all 0.15s;
        }
        #__scrollmate_dir__ button.active {
          background: #00e5a0;
          border-color: #00e5a0;
          color: #0f0f0f;
          font-weight: 600;
        }
        #__scrollmate_hover_toggle__ {
          display: flex;
          align-items: center;
          gap: 8px;
          cursor: pointer;
          font-size: 12px;
          color: #aaa;
        }
        #__scrollmate_hover_toggle__ input {
          accent-color: #00e5a0;
          width: 14px;
          height: 14px;
        }
        #__scrollmate_btn__ {
          width: 52px;
          height: 52px;
          border-radius: 50%;
          background: #0f0f0f;
          border: 2px solid #2a2a2a;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 20px rgba(0,0,0,0.4);
          transition: all 0.2s;
          position: relative;
          overflow: hidden;
        }
        #__scrollmate_btn__:hover {
          border-color: #00e5a0;
          transform: scale(1.05);
        }
        #__scrollmate_btn__.active {
          background: #00e5a0;
          border-color: #00e5a0;
        }
        #__scrollmate_btn__.active svg path {
          stroke: #0f0f0f;
        }
        #__scrollmate_btn__ svg {
          width: 22px;
          height: 22px;
        }
        #__scrollmate_btn__ svg path {
          stroke: #00e5a0;
          transition: stroke 0.2s;
        }
        @keyframes sm-pulse {
          0%, 100% { box-shadow: 0 4px 20px rgba(0,0,0,0.4), 0 0 0 0 rgba(0,229,160,0.3); }
          50% { box-shadow: 0 4px 20px rgba(0,0,0,0.4), 0 0 0 8px rgba(0,229,160,0); }
        }
        #__scrollmate_btn__.active {
          animation: sm-pulse 2s infinite;
        }
        #__scrollmate_shortcut__ {
          font-size: 10px;
          color: #444;
          text-align: center;
        }
      </style>

      <div id="__scrollmate_panel__">
        <div>
          <div class="sm-label">Scroll Speed</div>
          <div class="sm-row">
            <input type="range" id="__scrollmate_speed__" min="1" max="15" value="2" step="1">
            <span id="__scrollmate_speed_val__">2</span>
          </div>
        </div>
        <div>
          <div class="sm-label">Direction</div>
          <div id="__scrollmate_dir__">
            <button id="__sm_down__" class="active">▼ Down</button>
            <button id="__sm_up__">▲ Up</button>
          </div>
        </div>
        <label id="__scrollmate_hover_toggle__">
          <input type="checkbox" id="__sm_hover__" checked>
          Pause on hover
        </label>
        <div id="__scrollmate_shortcut__">Shortcut: Alt + S</div>
      </div>

      <div id="__scrollmate_btn__" title="ScrollMate — Click to scroll, right-click for settings">
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 5v14M8 15l4 4 4-4" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          <path d="M8 9l4-4 4 4" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" opacity="0.4"/>
        </svg>
      </div>
    `;

    document.body.appendChild(wrapper);
    floatingBtn = wrapper;

    // Wire up events
    const btn = wrapper.querySelector('#__scrollmate_btn__');
    const panel = wrapper.querySelector('#__scrollmate_panel__');
    const speedSlider = wrapper.querySelector('#__scrollmate_speed__');
    const speedVal = wrapper.querySelector('#__scrollmate_speed_val__');
    const dirDown = wrapper.querySelector('#__sm_down__');
    const dirUp = wrapper.querySelector('#__sm_up__');
    const hoverCheck = wrapper.querySelector('#__sm_hover__');

    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleScroll();
    });

    btn.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      e.stopPropagation();
      panel.classList.toggle('visible');
    });

    speedSlider.addEventListener('input', () => {
      speed = parseInt(speedSlider.value);
      speedVal.textContent = speed;
    });

    dirDown.addEventListener('click', () => {
      direction = 'down';
      dirDown.classList.add('active');
      dirUp.classList.remove('active');
    });

    dirUp.addEventListener('click', () => {
      direction = 'up';
      dirUp.classList.add('active');
      dirDown.classList.remove('active');
    });

    hoverCheck.addEventListener('change', () => {
      pauseOnHover = hoverCheck.checked;
    });

    // Pause on hover over page content
    document.addEventListener('mouseenter', () => { isHovering = true; }, true);
    document.addEventListener('mouseleave', () => { isHovering = false; }, true);

    // Don't pause when hovering the button itself
    wrapper.addEventListener('mouseenter', (e) => {
      e.stopPropagation();
      isHovering = false;
    }, true);

    // Close panel on outside click
    document.addEventListener('click', (e) => {
      if (!wrapper.contains(e.target)) {
        panel.classList.remove('visible');
      }
    });

    isVisible = true;
  }

  function removeFloatingButton() {
    if (floatingBtn) {
      floatingBtn.remove();
      floatingBtn = null;
      isVisible = false;
    }
    stopScrolling();
  }

  function updateButtonState(active) {
    const btn = document.querySelector('#__scrollmate_btn__');
    if (!btn) return;
    if (active) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  }

  /* ─────────────────────────────────────────
     KEYBOARD SHORTCUT — Alt + S
  ───────────────────────────────────────── */
  document.addEventListener('keydown', (e) => {
    if (e.altKey && e.key === 's') {
      e.preventDefault();
      if (!isVisible) createFloatingButton();
      toggleScroll();
    }
    // Alt + H to show/hide button
    if (e.altKey && e.key === 'h') {
      e.preventDefault();
      if (isVisible) {
        removeFloatingButton();
      } else {
        createFloatingButton();
      }
    }
  });

  /* ─────────────────────────────────────────
     MESSAGES FROM POPUP
  ───────────────────────────────────────── */
  chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
    switch (msg.action) {
      case 'toggle':
        if (!isVisible) createFloatingButton();
        toggleScroll();
        sendResponse({ scrolling: !!scrollInterval });
        break;

      case 'setSpeed':
        speed = msg.speed;
        sendResponse({ ok: true });
        break;

      case 'setDirection':
        direction = msg.direction;
        sendResponse({ ok: true });
        break;

      case 'setPauseOnHover':
        pauseOnHover = msg.value;
        sendResponse({ ok: true });
        break;

      case 'getState':
        sendResponse({
          scrolling: !!scrollInterval,
          speed,
          direction,
          pauseOnHover,
          visible: isVisible
        });
        break;

      case 'showButton':
        createFloatingButton();
        sendResponse({ ok: true });
        break;

      case 'hideButton':
        removeFloatingButton();
        sendResponse({ ok: true });
        break;
    }
    return true; // keep channel open for async
  });

})();

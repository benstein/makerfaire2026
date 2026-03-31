// src/ui/buildStatus.js
// Polls public/building.json and shows a "Now Building" banner when active.

const POLL_INTERVAL = 2000; // ms

let banner = null;
let pollTimer = null;
let wasBuilding = false;

export function initBuildStatus() {
  createBanner();
  poll(); // check immediately
  pollTimer = setInterval(poll, POLL_INTERVAL);
}

function createBanner() {
  banner = document.createElement('div');
  banner.id = 'build-status-banner';
  banner.innerHTML = `
    <div class="build-stripe"></div>
    <div class="build-content">
      <svg class="build-icon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
           stroke-width="2" stroke="currentColor" width="24" height="24">
        <path stroke-linecap="round" stroke-linejoin="round"
              d="M11.42 15.17 17.25 21A2.652 2.652 0 0 0 21 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 1 1-3.586-3.586l6.837-5.63m5.108-.233c.55-.164 1.163-.188 1.743-.14a4.5 4.5 0 0 0 4.486-6.336l-3.276 3.277a3.004 3.004 0 0 1-2.25-2.25l3.276-3.276a4.5 4.5 0 0 0-6.336 4.486c.049.58.025 1.193-.14 1.743" />
      </svg>
      <span class="build-text">
        <strong class="build-name"></strong>
        <span class="build-desc"></span>
      </span>
    </div>
  `;

  const style = document.createElement('style');
  style.textContent = `
    #build-status-banner {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      z-index: 9999;
      transform: translateY(-100%);
      transition: transform 0.4s cubic-bezier(0.22, 1, 0.36, 1);
      pointer-events: none;
    }
    #build-status-banner.visible {
      transform: translateY(0);
    }
    .build-stripe {
      height: 4px;
      background: repeating-linear-gradient(
        -45deg,
        #f1c40f,
        #f1c40f 10px,
        #1a1a2e 10px,
        #1a1a2e 20px
      );
      background-size: 28px 28px;
      animation: stripe-scroll 0.6s linear infinite;
    }
    @keyframes stripe-scroll {
      0% { background-position: 0 0; }
      100% { background-position: 28px 0; }
    }
    .build-content {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px 24px;
      background: rgba(15, 15, 35, 0.95);
      border-bottom: 1px solid #333;
      font-family: 'Courier New', monospace;
    }
    .build-icon {
      color: #f1c40f;
      flex-shrink: 0;
      animation: icon-pulse 1.5s ease-in-out infinite;
    }
    @keyframes icon-pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.4; }
    }
    .build-text {
      color: #ccc;
      font-size: 16px;
    }
    .build-name {
      color: #f1c40f;
      font-size: 18px;
    }
    .build-desc {
      color: #aaa;
    }
  `;

  document.head.appendChild(style);
  document.body.appendChild(banner);
}

async function poll() {
  try {
    const resp = await fetch('/building.json?t=' + Date.now());
    const data = await resp.json();

    if (data.building) {
      const nameEl = banner.querySelector('.build-name');
      const descEl = banner.querySelector('.build-desc');
      nameEl.textContent = data.name ? `${data.name}'s change` : 'New version';
      descEl.textContent = data.description ? ` — ${data.description}` : ' is being built...';
      banner.classList.add('visible');
      wasBuilding = true;
    } else {
      banner.classList.remove('visible');
      wasBuilding = false;
    }
  } catch {
    // File missing or malformed — hide banner
    banner.classList.remove('visible');
  }
}

// Clean up on HMR
if (import.meta.hot) {
  import.meta.hot.dispose(() => {
    clearInterval(pollTimer);
    banner?.remove();
  });
}

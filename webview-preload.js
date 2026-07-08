const { ipcRenderer } = require('electron');

const FMHY_HOST = 'fmhy.net';

function isFmhyDomain(url) {
  try {
    const h = new URL(url).hostname;
    return h === FMHY_HOST || h.endsWith('.' + FMHY_HOST);
  } catch { return false; }
}

// Intercept external link clicks and Base64 links
function initLinkInterceptor() {
  if (window.__fmhyPreloadLinks) return;
  window.__fmhyPreloadLinks = true;

  document.addEventListener('click', (e) => {
    const link = e.target.closest('a');
    if (!link) return;
    let href = link.getAttribute('href') || '';

    // Base64 encoded link — handle regardless of target attribute
    if (href.length > 20 && /^[A-Za-z0-9+/=]+$/.test(href)) {
      try {
        const decoded = atob(href);
        if (decoded.startsWith('http')) {
          e.preventDefault();
          e.stopPropagation();
          if (isFmhyDomain(decoded)) {
            window.location.href = decoded;
          } else {
            ipcRenderer.sendToHost('open-tab', decoded);
          }
          return;
        }
      } catch {}
    }

    // All external links open as tabs, regardless of target attribute
    if (href.startsWith('http') && !isFmhyDomain(href)) {
      e.preventDefault();
      e.stopPropagation();
      ipcRenderer.sendToHost('open-tab', href);
    }
  }, true);

  // MutationObserver for Base64 popup auto-click
  const observer = new MutationObserver(() => {
    const selectors = [
      '.base64-popup .confirm-btn',
      '.base64-popup button:last-child',
      '[class*="base64"] button',
    ];
    for (const sel of selectors) {
      try {
        const btn = document.querySelector(sel);
        if (btn && btn.textContent.includes('Open')) {
          btn.click();
          return;
        }
      } catch {}
    }
  });
  observer.observe(document.body, { childList: true, subtree: true });
}

// PiP support
function initPiP() {
  document.addEventListener('dblclick', (e) => {
    const video = e.target.closest('video');
    if (video && !video.disablePictureInPicture) {
      if (document.pictureInPictureElement) {
        document.exitPictureInPicture();
      } else {
        video.requestPictureInPicture();
      }
    }
  });
}

document.addEventListener('DOMContentLoaded', () => {
  try { ipcRenderer.sendToHost('page-title', document.title); } catch {}
});

setTimeout(initLinkInterceptor, 500);
setTimeout(initPiP, 2000);

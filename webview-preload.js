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
      } catch (e) { console.error(e); }
    }

    // All external links open as tabs, regardless of target attribute
    if (href.startsWith('http') && !isFmhyDomain(href)) {
      e.preventDefault();
      e.stopPropagation();
      ipcRenderer.sendToHost('open-tab', href);
    }
  }, true);

  // MutationObserver for Base64 popup auto-click
  let observerTimer;
  const observer = new MutationObserver(() => {
    if (observerTimer) return;
    observerTimer = requestAnimationFrame(() => {
      observerTimer = null;
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
        } catch (e) { console.error(e); }
      }
    });
  });
  observer.observe(document.body, { childList: true, subtree: true });
}

// Video download overlay
function initVideoDownload() {
  const style = document.createElement('style');
  style.textContent = `
    .fmhy-dl-btn {
      position: absolute;
      top: 8px; right: 8px;
      width: 32px; height: 32px;
      background: rgba(0,0,0,.65);
      border: 1px solid rgba(255,255,255,.3);
      border-radius: 4px;
      color: #fff;
      font-size: 16px;
      cursor: pointer;
      z-index: 2147483647;
      display: flex;
      align-items: center;
      justify-content: center;
      line-height: 1;
      pointer-events: none;
      opacity: 0;
      transition: opacity .15s;
    }
    .fmhy-dl-btn.show, .fmhy-dl-btn.show {
      pointer-events: auto;
      opacity: 1;
    }
    .fmhy-dl-btn.show:hover { background: rgba(233,69,96,.8); }
  `;
  document.head.appendChild(style);

  function addDownloadBtn(video) {
    if (video.dataset.fmhyDownload) return;
    video.dataset.fmhyDownload = '1';
    video.style.position = video.style.position || 'relative';

    const btn = document.createElement('button');
    btn.className = 'fmhy-dl-btn';
    btn.textContent = '\u2B07';
    btn.title = 'Download video';

    let hideTimer;
    function showBtn() { clearTimeout(hideTimer); btn.classList.add('show'); }
    function hideBtn() { hideTimer = setTimeout(() => btn.classList.remove('show'), 100); }

    video.addEventListener('mouseenter', showBtn);
    video.addEventListener('mouseleave', hideBtn);
    btn.addEventListener('mouseenter', showBtn);
    btn.addEventListener('mouseleave', hideBtn);
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      e.preventDefault();
      const src = video.currentSrc || video.src || '';
      if (src && src.startsWith('http')) {
        ipcRenderer.invoke('download-video', src);
      }
    });

    video.parentNode.insertBefore(btn, video.nextSibling);
  }

  document.querySelectorAll('video').forEach(addDownloadBtn);
  const obs = new MutationObserver(() => {
    document.querySelectorAll('video:not([data-fmhy-download])').forEach(addDownloadBtn);
  });
  obs.observe(document.body, { childList: true, subtree: true });
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

function onReady(fn) {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', fn);
  } else {
    fn();
  }
}

onReady(() => {
  try { ipcRenderer.sendToHost('page-title', document.title); } catch (e) { console.error(e); }
  initLinkInterceptor();
  initVideoDownload();
  initPiP();
});

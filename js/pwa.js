let deferredPrompt = null;

const INSTALL_SVG = `<svg class="install-svg" viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path fill="currentColor" d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/></svg>`;

export function isAppInstalled() {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    window.navigator.standalone === true
  );
}

export function isIosSafari() {
  const ua = navigator.userAgent;
  return /iPad|iPhone|iPod/.test(ua) && !window.MSStream;
}

export function canShowInstallButton() {
  return !isAppInstalled() && (deferredPrompt !== null || isIosSafari());
}

function getInstallButtons() {
  return document.querySelectorAll('[data-pwa-install]');
}

function updateInstallVisibility() {
  const show = canShowInstallButton();
  getInstallButtons().forEach(btn => {
    btn.classList.toggle('hidden', !show);
  });
}

function showIosInstallHint() {
  alert(
    'Install KhelZon on iPhone/iPad:\n\n' +
    '1. Tap the Share button in Safari\n' +
    '2. Choose "Add to Home Screen"\n' +
    '3. Tap Add\n\n' +
    'The app will open full-screen like a native app.'
  );
}

async function triggerInstall() {
  if (isAppInstalled()) return;

  if (isIosSafari() && !deferredPrompt) {
    showIosInstallHint();
    return;
  }

  if (!deferredPrompt) return;

  deferredPrompt.prompt();
  const { outcome } = await deferredPrompt.userChoice;
  deferredPrompt = null;
  updateInstallVisibility();

  if (outcome === 'accepted') {
    getInstallButtons().forEach(btn => btn.classList.add('hidden'));
  }
}

export function renderInstallButton(className = 'btn btn-lobby-outline pwa-install-lobby', label = 'Install App') {
  const hidden = canShowInstallButton() ? '' : ' hidden';
  return `
    <button type="button" class="${className}${hidden}" data-pwa-install aria-label="Install KhelZon app">
      ${INSTALL_SVG}<span>${label}</span>
    </button>
  `;
}

export function renderHeaderInstallButton() {
  const hidden = canShowInstallButton() ? '' : ' hidden';
  return `
    <button type="button" class="tool-btn pwa-install-btn${hidden}" data-pwa-install title="Install app" aria-label="Install KhelZon app">
      ${INSTALL_SVG}
      <span class="tool-btn-label">Install</span>
    </button>
  `;
}

export function initPwa() {
  window.addEventListener('beforeinstallprompt', e => {
    e.preventDefault();
    deferredPrompt = e;
    updateInstallVisibility();
  });

  window.addEventListener('appinstalled', () => {
    deferredPrompt = null;
    getInstallButtons().forEach(btn => btn.classList.add('hidden'));
  });

  document.addEventListener('click', e => {
    if (e.target.closest('[data-pwa-install]')) {
      e.preventDefault();
      triggerInstall();
    }
  });

  updateInstallVisibility();
}

export function refreshInstallButtons() {
  updateInstallVisibility();
}

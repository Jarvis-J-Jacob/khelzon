const SOUND_KEY = 'sound';

export function isSoundEnabled() {
  try {
    return localStorage.getItem(SOUND_KEY) !== 'off';
  } catch {
    return true;
  }
}

function setSoundEnabled(enabled) {
  try { localStorage.setItem(SOUND_KEY, enabled ? 'on' : 'off'); } catch { /* ignore */ }
  syncSoundToggleUI();
}

function syncSoundToggleUI() {
  const enabled = isSoundEnabled();
  document.querySelectorAll('.sound-toggle').forEach(button => {
    button.textContent = enabled ? '🔊' : '🔇';
    button.setAttribute('aria-label', enabled ? 'Mute sound effects' : 'Unmute sound effects');
    button.title = enabled ? 'Mute sound effects' : 'Unmute sound effects';
    button.setAttribute('aria-pressed', String(!enabled));
  });
}

function injectSoundToggles() {
  ['headerTools', 'sidebarTools', 'gameScreenTools'].forEach(id => {
    const container = document.getElementById(id);
    if (!container || container.querySelector('.sound-toggle')) return;

    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'tool-btn sound-toggle';
    container.append(button);
  });
  syncSoundToggleUI();
}

document.addEventListener('click', event => {
  if (!event.target.closest('.sound-toggle')) return;
  event.preventDefault();
  setSoundEnabled(!isSoundEnabled());
});

new MutationObserver(injectSoundToggles).observe(document.body, { childList: true, subtree: true });
injectSoundToggles();

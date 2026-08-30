import { gameRegistry } from './gameRegistry.js';

const BUTTON_ID = 'surpriseMeBtn';

function injectSurpriseButton() {
  if (!location.hash.startsWith('#/arcade')) return;
  if (document.getElementById(BUTTON_ID)) return;

  const searchWrap = document.querySelector('.search-wrap');
  if (!searchWrap) return;

  const button = document.createElement('button');
  button.id = BUTTON_ID;
  button.type = 'button';
  button.className = 'btn btn-primary surprise-me-btn';
  button.setAttribute('aria-label', 'Play a random game');
  button.innerHTML = '<span aria-hidden="true">🎲</span> Surprise Me';
  button.addEventListener('click', () => {
    if (!gameRegistry.length) return;
    const game = gameRegistry[Math.floor(Math.random() * gameRegistry.length)];
    location.hash = `#/play/${game.id}`;
  });

  searchWrap.append(button);
}

const style = document.createElement('style');
style.textContent = `
  .search-wrap { display: flex; gap: 0.65rem; align-items: center; }
  .search-wrap .arcade-search { flex: 1; }
  .surprise-me-btn { white-space: nowrap; }
  @media (max-width: 560px) {
    .search-wrap { flex-direction: column; align-items: stretch; }
  }
`;
document.head.append(style);

new MutationObserver(injectSurpriseButton).observe(document.body, { childList: true, subtree: true });
window.addEventListener('hashchange', injectSurpriseButton);
injectSurpriseButton();

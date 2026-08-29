import { storage } from '../storage.js';
import { shareScore } from '../share.js';

export default function initTargetTap(container) {
  container.innerHTML = `
    <div class="game-wrap game-wrap--fit">
      <div class="game-top-bar">
        <div class="game-hud game-hud--compact">
          <div class="hud-item"><span class="hud-label">Score</span><span class="hud-value" id="ttScore">0</span></div>
          <div class="hud-item"><span class="hud-label">Misses</span><span class="hud-value" id="ttMiss">0</span></div>
          <div class="hud-item"><span class="hud-label">Best</span><span class="hud-value" id="ttBest">0</span></div>
        </div>
        <div class="game-toolbar">
          <button class="btn btn-primary" id="ttStart">Start</button>
        </div>
      </div>
      <div class="game-play-area tt-arena" id="ttArena">
        <p class="tt-idle" id="ttIdle">Press Start — tap targets before they vanish!</p>
      </div>
      <div id="ttMsg"></div>
    </div>
  `;

  const arena = document.getElementById('ttArena');
  const idleEl = document.getElementById('ttIdle');
  let score, misses, running, over, spawnTimer;
  const maxMisses = 5;

  function reset() {
    score = 0;
    misses = 0;
    running = false;
    over = false;
    clearTimeout(spawnTimer);
    arena.querySelectorAll('.tt-target').forEach(el => el.remove());
    idleEl.hidden = false;
    document.getElementById('ttScore').textContent = '0';
    document.getElementById('ttMiss').textContent = '0';
    document.getElementById('ttMsg').innerHTML = '';
  }

  function endGame() {
    over = true;
    running = false;
    clearTimeout(spawnTimer);
    arena.querySelectorAll('.tt-target').forEach(el => el.remove());
    idleEl.hidden = false;
    storage.saveScore('target-tap', score);
    document.getElementById('ttMsg').innerHTML = `
  <div class="game-msg lose">Game over! Score: ${score}</div>
  <button id="ttShareBtn" class="btn btn-share">Share Score ↗</button>
`;
document.getElementById('ttShareBtn').addEventListener('click', () => {
  shareScore(score, 'Target Tap');
});
    const best = storage.getScore('target-tap');
    document.getElementById('ttBest').textContent = best.best || score;
  }

  function spawnTarget() {
    if (!running || over) return;

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'tt-target';
    btn.setAttribute('aria-label', 'Tap target');

    const pad = 48;
    const rect = arena.getBoundingClientRect();
    const maxW = Math.max(rect.width - pad * 2, 80);
    const maxH = Math.max(rect.height - pad * 2, 80);
    btn.style.left = `${pad + Math.random() * maxW}px`;
    btn.style.top = `${pad + Math.random() * maxH}px`;
    btn.style.transform = 'translate(-50%, -50%)';

    const lifetime = Math.max(700, 1400 - score * 12);
    let hit = false;

    btn.addEventListener('click', () => {
      if (hit || over) return;
      hit = true;
      score++;
      document.getElementById('ttScore').textContent = score;
      btn.remove();
    });

    arena.appendChild(btn);

    setTimeout(() => {
      if (hit || over) return;
      misses++;
      document.getElementById('ttMiss').textContent = misses;
      btn.remove();
      if (misses >= maxMisses) endGame();
    }, lifetime);

    const next = Math.max(450, 900 - score * 8);
    spawnTimer = setTimeout(spawnTarget, next);
  }

  document.getElementById('ttStart').addEventListener('click', () => {
    if (over) reset();
    running = true;
    idleEl.hidden = true;
    spawnTarget();
  });

  const best = storage.getScore('target-tap');
  document.getElementById('ttBest').textContent = best.best || 0;
  reset();

  return () => {
    clearTimeout(spawnTimer);
    arena.querySelectorAll('.tt-target').forEach(el => el.remove());
  };
}

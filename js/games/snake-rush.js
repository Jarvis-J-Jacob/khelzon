import { storage } from '../storage.js';
import { fitCanvasDisplay } from '../gameFit.js';
import { shareScore } from '../share.js';

export default function initSnakeRush(container) {
  const W = 400, H = 400, CELL = 20;
  const COLS = W / CELL, ROWS = H / CELL;

  container.innerHTML = `
    <div class="game-wrap game-wrap--fit">
      <div class="game-top-bar">
        <div class="game-hud game-hud--compact">
          <div class="hud-item"><span class="hud-label">Score</span><span class="hud-value" id="snScore">0</span></div>
          <div class="hud-item"><span class="hud-label">Length</span><span class="hud-value" id="snLen">3</span></div>
          <div class="hud-item"><span class="hud-label">Speed</span><span class="hud-value" id="snSpeed">1x</span></div>
        </div>
        <div class="game-toolbar">
          <button class="btn btn-primary" id="snStart">Start</button>
          <button class="btn btn-secondary" id="snPause">Pause</button>
        </div>
      </div>
      <div class="game-play-area" id="snPlayArea">
        <canvas class="game-canvas" id="snCanvas" width="${W}" height="${H}"></canvas>
      </div>
      <div class="mobile-dpad" id="snDpad">
        <button class="dpad-up" data-dir="up">▲</button>
        <button class="dpad-left" data-dir="left">◀</button>
        <button class="dpad-down" data-dir="down">▼</button>
        <button class="dpad-right" data-dir="right">▶</button>
      </div>
      <div id="snMsg"></div>
    </div>
  `;

  const canvas = document.getElementById('snCanvas');
  const ctx = canvas.getContext('2d');
  let snake, dir, nextDir, gem, score, running, paused, tickMs, interval, gameOver;

  function reset() {
    snake = [{ x: 10, y: 10 }, { x: 9, y: 10 }, { x: 8, y: 10 }];
    dir = { x: 1, y: 0 };
    nextDir = { ...dir };
    score = 0;
    tickMs = 140;
    running = false;
    paused = false;
    gameOver = false;
    spawnGem();
    updateHud();
    document.getElementById('snMsg').innerHTML = '';
    draw();
  }

  function spawnGem() {
    do {
      gem = { x: Math.floor(Math.random() * COLS), y: Math.floor(Math.random() * ROWS) };
    } while (snake.some(s => s.x === gem.x && s.y === gem.y));
  }

  function updateHud() {
    document.getElementById('snScore').textContent = score;
    document.getElementById('snLen').textContent = snake.length;
    document.getElementById('snSpeed').textContent = Math.round(140 / tickMs * 10) / 10 + 'x';
  }

  function setDir(nx, ny) {
    if (nx === -dir.x && ny === -dir.y) return;
    nextDir = { x: nx, y: ny };
  }

  function tick() {
    if (!running || paused || gameOver) return;
    dir = { ...nextDir };
    const head = { x: snake[0].x + dir.x, y: snake[0].y + dir.y };

    if (head.x < 0 || head.x >= COLS || head.y < 0 || head.y >= ROWS ||
        snake.some(s => s.x === head.x && s.y === head.y)) {
      gameOver = true;
      running = false;
      clearInterval(interval);
      storage.saveScore('snake-rush', score);
      document.getElementById('snMsg').innerHTML = `
  <div class="game-msg lose">Game Over! Score: ${score}</div>
  <button id="snShareBtn" class="btn btn-share">Share Score ↗</button>
`;
document.getElementById('snShareBtn').addEventListener('click', () => {
  shareScore(score, 'Snake Rush');
});
      return;
    }

    snake.unshift(head);
    if (head.x === gem.x && head.y === gem.y) {
      score += 10;
      tickMs = Math.max(60, tickMs - 3);
      clearInterval(interval);
      interval = setInterval(tick, tickMs);
      spawnGem();
    } else {
      snake.pop();
    }
    updateHud();
    draw();
  }

  function draw() {
    ctx.fillStyle = '#0a0a14';
    ctx.fillRect(0, 0, W, H);

    // Grid dots
    ctx.fillStyle = 'rgba(255,255,255,0.03)';
    for (let x = 0; x < COLS; x++)
      for (let y = 0; y < ROWS; y++) {
        ctx.fillRect(x * CELL + CELL / 2 - 1, y * CELL + CELL / 2 - 1, 2, 2);
      }

    // Gem
    const gx = gem.x * CELL + CELL / 2, gy = gem.y * CELL + CELL / 2;
    const grad = ctx.createRadialGradient(gx, gy, 2, gx, gy, CELL / 2);
    grad.addColorStop(0, '#e9c46a');
    grad.addColorStop(1, '#e76f51');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(gx, gy, CELL / 2 - 2, 0, Math.PI * 2);
    ctx.fill();

    // Snake
    snake.forEach((s, i) => {
      const t = i / snake.length;
      ctx.fillStyle = i === 0 ? '#2a9d8f' : `rgba(42,157,143,${1 - t * 0.5})`;
      ctx.fillRect(s.x * CELL + 1, s.y * CELL + 1, CELL - 2, CELL - 2);
      if (i === 0) {
        ctx.fillStyle = '#fff';
        ctx.fillRect(s.x * CELL + 5, s.y * CELL + 5, 4, 4);
        ctx.fillRect(s.x * CELL + 11, s.y * CELL + 5, 4, 4);
      }
    });
  }

  function onKey(e) {
    const k = e.key.toLowerCase();
    if (k === 'arrowup' || k === 'w') setDir(0, -1);
    else if (k === 'arrowdown' || k === 's') setDir(0, 1);
    else if (k === 'arrowleft' || k === 'a') setDir(-1, 0);
    else if (k === 'arrowright' || k === 'd') setDir(1, 0);
    if (['arrowup','arrowdown','arrowleft','arrowright'].includes(k)) e.preventDefault();
  }

  document.getElementById('snStart').addEventListener('click', () => {
    if (gameOver) reset();
    running = true;
    paused = false;
    clearInterval(interval);
    interval = setInterval(tick, tickMs);
  });

  document.getElementById('snPause').addEventListener('click', () => {
    paused = !paused;
  });

  document.getElementById('snDpad').addEventListener('click', e => {
    const d = e.target.dataset.dir;
    if (d === 'up') setDir(0, -1);
    if (d === 'down') setDir(0, 1);
    if (d === 'left') setDir(-1, 0);
    if (d === 'right') setDir(1, 0);
  });

  window.addEventListener('keydown', onKey);
  const unfit = fitCanvasDisplay(canvas, document.getElementById('snPlayArea'));
  reset();

  return () => {
    clearInterval(interval);
    window.removeEventListener('keydown', onKey);
    unfit();
  };
}

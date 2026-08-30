import { storage } from '../storage.js';
import { fitCanvasDisplay } from '../gameFit.js';
import { shareScore } from '../share.js';

export default function initOrbitBreaker(container) {
  const W = 480, H = 360;
  container.innerHTML = `
    <div class="game-wrap game-wrap--fit">
      <div class="game-top-bar">
        <div class="game-hud game-hud--compact">
          <div class="hud-item"><span class="hud-label">Score</span><span class="hud-value" id="obScore">0</span></div>
          <div class="hud-item"><span class="hud-label">Level</span><span class="hud-value" id="obLevel">1</span></div>
          <div class="hud-item"><span class="hud-label">Lives</span><span class="hud-value" id="obLives">3</span></div>
        </div>
        <div class="game-toolbar">
          <button class="btn btn-primary" id="obStart">Start</button>
        </div>
      </div>
      <div class="game-play-area" id="obPlayArea">
        <canvas class="game-canvas" id="obCanvas" width="${W}" height="${H}"></canvas>
      </div>
      <div id="obMsg"></div>
    </div>
  `;

  const canvas = document.getElementById('obCanvas');
  const ctx = canvas.getContext('2d');
  let paddle, ball, bricks, score, level, lives, running, raf, mx;

  function makeBricks(lvl) {
    const rows = Math.min(3 + lvl, 7);
    const cols = 10;
    const bw = (W - 40) / cols - 4;
    const list = [];
    for (let r = 0; r < rows; r++)
      for (let c = 0; c < cols; c++)
        list.push({
          x: 20 + c * (bw + 4),
          y: 30 + r * 22,
          w: bw, h: 18,
          hp: 1 + Math.floor(lvl / 2),
          maxHp: 1 + Math.floor(lvl / 2),
          hue: (r * 40 + c * 15 + lvl * 20) % 360,
        });
    return list;
  }

  function resetBall() {
    ball = { x: W / 2, y: H - 50, vx: 3 * (Math.random() > 0.5 ? 1 : -1), vy: -4, r: 7 };
    paddle.x = W / 2 - paddle.w / 2;
  }

  function reset() {
    paddle = { x: W / 2 - 40, y: H - 24, w: 80, h: 12 };
    score = 0;
    level = 1;
    lives = 3;
    running = false;
    bricks = makeBricks(level);
    resetBall();
    updateHud();
    document.getElementById('obMsg').innerHTML = '';
    draw();
  }

  function updateHud() {
    document.getElementById('obScore').textContent = score;
    document.getElementById('obLevel').textContent = level;
    document.getElementById('obLives').textContent = lives;
  }

  function nextLevel() {
    level++;
    bricks = makeBricks(level);
    resetBall();
    updateHud();
    if (level > 5) {
      running = false;
      storage.saveScore('orbit-breaker', score);
      document.getElementById('obMsg').innerHTML = `<div class="game-msg win">You cleared all levels! Score: ${score}</div>`;
    }
  }

  function update() {
    if (!running) return;

    paddle.x = Math.max(0, Math.min(W - paddle.w, (mx ?? paddle.x + paddle.w / 2) - paddle.w / 2));

    ball.x += ball.vx;
    ball.y += ball.vy;

    if (ball.x - ball.r < 0 || ball.x + ball.r > W) ball.vx *= -1;
    if (ball.y - ball.r < 0) ball.vy *= -1;

    if (ball.y + ball.r > H) {
      lives--;
      updateHud();
      if (lives <= 0) {
        running = false;
        storage.saveScore('orbit-breaker', score);
        document.getElementById('obMsg').innerHTML = `
  <div class="game-msg lose">Game Over! Score: ${score}</div>
  <button id="obShareBtn" class="btn btn-share">Share Score ↗</button>
`;
document.getElementById('obShareBtn').addEventListener('click', () => {
  shareScore(score, 'Orbit Breaker');
});
        return;
      }
      resetBall();
      return;
    }

    if (ball.y + ball.r >= paddle.y && ball.y - ball.r <= paddle.y + paddle.h &&
        ball.x >= paddle.x && ball.x <= paddle.x + paddle.w) {
      ball.vy = -Math.abs(ball.vy);
      const hit = (ball.x - paddle.x) / paddle.w - 0.5;
      ball.vx = hit * 8;
    }

    bricks = bricks.filter(b => {
      if (ball.x + ball.r > b.x && ball.x - ball.r < b.x + b.w &&
          ball.y + ball.r > b.y && ball.y - ball.r < b.y + b.h) {
        ball.vy *= -1;
        b.hp--;
        if (b.hp <= 0) { score += 10 * level; updateHud(); return false; }
      }
      return true;
    });

    if (!bricks.length) nextLevel();
  }

  function draw() {
    ctx.fillStyle = '#0a0a14';
    ctx.fillRect(0, 0, W, H);

    bricks.forEach(b => {
      const alpha = b.hp / b.maxHp;
      ctx.fillStyle = `hsla(${b.hue},70%,55%,${0.4 + alpha * 0.6})`;
      ctx.fillRect(b.x, b.y, b.w, b.h);
      ctx.strokeStyle = `hsla(${b.hue},80%,70%,0.6)`;
      ctx.strokeRect(b.x, b.y, b.w, b.h);
    });

    const pg = ctx.createLinearGradient(paddle.x, paddle.y, paddle.x + paddle.w, paddle.y);
    pg.addColorStop(0, '#f4a261');
    pg.addColorStop(1, '#e76f51');
    ctx.fillStyle = pg;
    ctx.beginPath();
    ctx.roundRect(paddle.x, paddle.y, paddle.w, paddle.h, 4);
    ctx.fill();

    const bg = ctx.createRadialGradient(ball.x, ball.y, 1, ball.x, ball.y, ball.r);
    bg.addColorStop(0, '#e9c46a');
    bg.addColorStop(1, '#e76f51');
    ctx.fillStyle = bg;
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.r, 0, Math.PI * 2);
    ctx.fill();
  }

  function loop() {
    update();
    draw();
    raf = requestAnimationFrame(loop);
  }

  function onMouse(e) {
    const rect = canvas.getBoundingClientRect();
    mx = (e.clientX - rect.left) * (W / rect.width);
  }

  function onKey(e) {
    if (!running) return;
    if (e.key === 'ArrowLeft' || e.key === 'a') paddle.x = Math.max(0, paddle.x - 20);
    if (e.key === 'ArrowRight' || e.key === 'd') paddle.x = Math.min(W - paddle.w, paddle.x + 20);
  }

  canvas.addEventListener('mousemove', onMouse);
  canvas.addEventListener('touchmove', e => { e.preventDefault(); onMouse(e.touches[0]); }, { passive: false });

  document.getElementById('obStart').addEventListener('click', () => {
    if (lives <= 0 || level > 5) reset();
    running = true;
    cancelAnimationFrame(raf);
    loop();
  });

  window.addEventListener('keydown', onKey);
  const unfit = fitCanvasDisplay(canvas, document.getElementById('obPlayArea'));
  reset();

  return () => {
    cancelAnimationFrame(raf);
    window.removeEventListener('keydown', onKey);
    canvas.removeEventListener('mousemove', onMouse);
    unfit();
  };
}

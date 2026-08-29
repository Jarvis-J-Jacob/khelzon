import { storage } from '../storage.js';
import { fitGrid } from '../gameFit.js';
import { shareScore } from '../share.js';

const SIZE = 6;
const PLAYER = 1;
const CPU = 2;

export default function initTerritoryClash(container) {
  container.innerHTML = `
    <div class="game-wrap game-wrap--fit">
      <div class="game-top-bar">
        <div class="game-hud game-hud--compact">
          <div class="hud-item"><span class="hud-label">You</span><span class="hud-value" id="tcYou">1</span></div>
          <div class="hud-item"><span class="hud-label">CPU</span><span class="hud-value" id="tcCpu">1</span></div>
          <div class="hud-item"><span class="hud-label">Turn</span><span class="hud-value" id="tcTurn">You</span></div>
        </div>
        <div class="game-toolbar">
          <button class="btn btn-primary" id="tcNew">New Game</button>
        </div>
      </div>
      <div class="game-play-area" id="tcPlayArea">
        <div class="tc-grid" id="tcGrid" role="grid" aria-label="Territory board"></div>
      </div>
      <p class="tc-hint">Click an empty cell next to your gold tiles to claim it.</p>
      <div id="tcMsg"></div>
    </div>
  `;

  const gridEl = document.getElementById('tcGrid');
  const playArea = document.getElementById('tcPlayArea');
  let board, playerTurn, over;

  function initBoard() {
    board = Array.from({ length: SIZE }, () => Array(SIZE).fill(0));
    board[SIZE - 1][0] = PLAYER;
    board[0][SIZE - 1] = CPU;
    playerTurn = true;
    over = false;
    document.getElementById('tcMsg').innerHTML = '';
    updateHud();
    render();
  }

  function count(owner) {
    return board.flat().filter(v => v === owner).length;
  }

  function updateHud() {
    document.getElementById('tcYou').textContent = count(PLAYER);
    document.getElementById('tcCpu').textContent = count(CPU);
    document.getElementById('tcTurn').textContent = over ? 'Done' : playerTurn ? 'You' : 'CPU';
  }

  function neighbors(r, c) {
    return [[-1, 0], [1, 0], [0, -1], [0, 1]]
      .map(([dr, dc]) => [r + dr, c + dc])
      .filter(([nr, nc]) => nr >= 0 && nr < SIZE && nc >= 0 && nc < SIZE);
  }

  function validMoves(owner) {
    const moves = [];
    for (let r = 0; r < SIZE; r++) {
      for (let c = 0; c < SIZE; c++) {
        if (board[r][c] !== 0) continue;
        if (neighbors(r, c).some(([nr, nc]) => board[nr][nc] === owner)) {
          moves.push([r, c]);
        }
      }
    }
    return moves;
  }

  function applyMove(r, c, owner) {
    board[r][c] = owner;
  }

  function endGame() {
    over = true;
    const you = count(PLAYER);
    const cpu = count(CPU);
    let msg;
    if (you > cpu) {
      msg = `<div class="game-msg win">Victory! You control ${you} tiles.</div>`;
      storage.saveScore('territory-clash', you);
    } else if (cpu > you) {
      msg = `<div class="game-msg lose">Defeat. CPU controls ${cpu} tiles.</div>`;
      storage.saveScore('territory-clash', you);
    } else {
      msg = `<div class="game-msg">Draw — ${you} tiles each.</div>`;
      storage.saveScore('territory-clash', you);
    }
   document.getElementById('tcMsg').innerHTML = `
  ${msg}
  <button id="tcShareBtn" class="btn btn-share">Share Score ↗</button>
`;
document.getElementById('tcShareBtn').addEventListener('click', () => {
  shareScore(you, 'Territory Clash');
});
    updateHud();
    render();
  }

  function cpuTurn() {
    const moves = validMoves(CPU);
    if (!moves.length) {
      if (!validMoves(PLAYER).length) endGame();
      else {
        playerTurn = true;
        updateHud();
        render();
      }
      return;
    }
    const [r, c] = moves[Math.floor(Math.random() * moves.length)];
    applyMove(r, c, CPU);
    playerTurn = true;
    if (!validMoves(PLAYER).length && !validMoves(CPU).length) endGame();
    else updateHud();
    render();
  }

  function onCellClick(r, c) {
    if (over || !playerTurn) return;
    if (board[r][c] !== 0) return;
    if (!neighbors(r, c).some(([nr, nc]) => board[nr][nc] === PLAYER)) return;

    applyMove(r, c, PLAYER);
    playerTurn = false;
    updateHud();
    render();

    if (!validMoves(CPU).length && !validMoves(PLAYER).length) {
      endGame();
      return;
    }
    setTimeout(cpuTurn, 350);
  }

  function render() {
    gridEl.innerHTML = '';
    for (let r = 0; r < SIZE; r++) {
      for (let c = 0; c < SIZE; c++) {
        const cell = board[r][c];
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'tc-cell';
        if (cell === PLAYER) btn.classList.add('tc-player');
        else if (cell === CPU) btn.classList.add('tc-cpu');
        else if (playerTurn && !over && neighbors(r, c).some(([nr, nc]) => board[nr][nc] === PLAYER)) {
          btn.classList.add('tc-valid');
        }
        btn.setAttribute('aria-label', cell === PLAYER ? 'Your tile' : cell === CPU ? 'CPU tile' : 'Empty cell');
        btn.addEventListener('click', () => onCellClick(r, c));
        gridEl.appendChild(btn);
      }
    }
  }

  document.getElementById('tcNew').addEventListener('click', initBoard);
  const unfit = fitGrid(gridEl, playArea, SIZE, SIZE, 52);
  initBoard();

  return () => unfit();
}

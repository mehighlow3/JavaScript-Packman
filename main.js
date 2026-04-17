// Import game modules
import { pacman, ghosts, gameState, initLevel, resetGame } from './state.js';
import { initInput } from './input.js';
import { update } from './logic.js';
import { initRenderer, render } from './renderer.js';
import { initAudio } from './audio.js';

// Canvas and WebGL setup
const canvas = document.getElementById('glcanvas');
const gl = canvas.getContext('webgl');
if (!gl) alert('WebGL not supported');

// Resize canvas to viewport
function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    gl.viewport(0, 0, canvas.width, canvas.height);
}
window.addEventListener('resize', resize);
resize();

// Enable depth and face culling
gl.enable(gl.DEPTH_TEST);
gl.enable(gl.CULL_FACE);

// Initialize full game systems
initLevel();
initInput(pacman, gameState);
initRenderer(gl);
initAudio();

// Restart routine for UI and game reset
window.restartGame = function () {
    resetGame();

    const gameOverScreen = document.getElementById('game-over');
    const gameWinScreen = document.getElementById('game-win');

    if (gameOverScreen) gameOverScreen.style.display = 'none';
    if (gameWinScreen) gameWinScreen.style.display = 'none';
};

// Update UI elements: score, lives, status screens
function updateUI() {
    let sStr = gameState.score.toString().padStart(6, '0');
    document.getElementById('score').innerText = sStr;

    const container = document.getElementById('lives-container');

    if (container.childElementCount !== gameState.lives && gameState.lives >= 0) {
        container.innerHTML = '';
        for (let i = 0; i < gameState.lives; i++) {
            let icon = document.createElement('div');
            icon.className = 'life-icon';
            container.appendChild(icon);
        }
    }

    if (gameState.gameWon) {
        document.getElementById('game-win').style.display = 'block';
    } else if (gameState.lives <= 0) {
        document.getElementById('game-over').style.display = 'block';
    }
}

// Main game loop
let lastT = 0;
function loop(now) {
    let dt = (now - lastT) / 1000;
    lastT = now;
    if (dt > 0.1) dt = 0.1;

    update(dt);
    updateUI();
    render(pacman, ghosts, gameState);

    requestAnimationFrame(loop);
}

requestAnimationFrame(loop);

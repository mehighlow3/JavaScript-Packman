const { vec3 } = window.glMatrix;

// Map layout values
export const mapLayout = [
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
    [1,2,0,0,0,1,0,0,0,0,0,0,0,1,0,0,0,2,1],
    [1,0,1,1,0,1,0,1,1,1,1,1,0,1,0,1,1,0,1],
    [1,0,1,0,0,0,0,0,0,1,0,0,0,0,0,0,1,0,1],
    [1,0,1,0,1,1,1,1,0,1,0,1,1,1,1,0,1,0,1],
    [1,0,0,0,0,0,2,0,0,0,0,0,2,0,0,0,0,0,1],
    [1,0,1,1,1,0,1,1,1,1,1,1,1,0,1,1,1,0,1],
    [1,0,0,0,1,0,0,0,0,1,0,0,0,0,1,0,0,0,1],
    [1,1,1,0,1,0,1,1,0,1,0,1,1,0,1,0,1,1,1],

    [1,0,0,0,0,0,1,0,0,0,0,0,1,0,0,0,0,0,1],

    [1,0,1,1,1,1,1,0,1,1,1,0,1,1,1,1,1,0,1],
    [1,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,1],
    [1,0,1,1,0,1,1,1,0,1,0,1,1,1,0,1,1,0,1],
    [1,2,0,0,0,1,0,0,0,0,0,0,0,1,0,0,0,2,1],
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]
];

export const ROWS = mapLayout.length;
export const COLS = mapLayout[0].length;

// Pacman state
export const pacman = {
    pos: vec3.create(),
    dir: vec3.fromValues(1,0,0),
    nextDir: vec3.fromValues(1,0,0),
    speed: 4.0,
    mouthPhase: 0,
    currentRotation: 0,
    jumping: false,
    jumpTime: 0,
    jumpDur: 0.7,
    invincibleTimer: 0
};

// Ghost states
export const ghosts = [
    { pos: vec3.fromValues(-5,0,-5), dir: vec3.fromValues(0,0,1),  color:[1.0,0.0,0.0], speed:2.5, state:'ALIVE', invincibleTimer:0 },
    { pos: vec3.fromValues(5,0,5),   dir: vec3.fromValues(0,0,-1), color:[0.0,1.0,1.0], speed:2.5, state:'ALIVE', invincibleTimer:0 },
    { pos: vec3.fromValues(-5,0,5),  dir: vec3.fromValues(1,0,0),  color:[1.0,0.7,0.7], speed:2.5, state:'ALIVE', invincibleTimer:0 },
    { pos: vec3.fromValues(5,0,-5),  dir: vec3.fromValues(-1,0,0), color:[1.0,0.5,0.0], speed:2.5, state:'ALIVE', invincibleTimer:0 }
];

// Game state variables
export const gameState = {
    score: 0,
    lives: 3,
    freeze: false,
    freezeTimer: 0,
    hitPause: 0,
    shearView: true,
    ghostEdibleTimer: 0,
    gameWon: false,
    dots: [],
    walls: []
};

// Reset entire game
export function resetGame() {
    gameState.score = 0;
    gameState.lives = 3;
    gameState.gameWon = false;
    initLevel();
}

// Build dots & walls from layout
export function initLevel() {
    gameState.dots = [];
    gameState.walls = [];
    gameState.gameWon = false;

    for (let r=0; r<ROWS; r++) {
        for (let c=0; c<COLS; c++) {
            let t = mapLayout[r][c];
            let x = c - COLS/2 + 0.5;
            let z = r - ROWS/2 + 0.5;

            if (t === 1) gameState.walls.push({x,z});
            else if (t === 0 || t === 2) gameState.dots.push({x,z,big:t===2,active:true});
        }
    }

    resetRound();
}

// Reset positions for new round
export function resetRound() {
    vec3.set(pacman.pos, 0, 0, 2);
    vec3.set(pacman.dir, 1, 0, 0);
    vec3.set(pacman.nextDir, 1, 0, 0);
    pacman.currentRotation = Math.PI / 2;
    pacman.jumping = false;
    pacman.invincibleTimer = 0;

    ghosts[0].pos = vec3.fromValues(-5, 0, -5);
    ghosts[1].pos = vec3.fromValues(5, 0, 5);
    ghosts[2].pos = vec3.fromValues(-5, 0, 5);
    ghosts[3].pos = vec3.fromValues(5, 0, -5);

    ghosts.forEach(g => {
        g.state = 'ALIVE';
        g.invincibleTimer = 0;
    });

    gameState.freeze = false;
    gameState.hitPause = 0;
}

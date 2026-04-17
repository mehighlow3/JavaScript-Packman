import { pacman, ghosts, gameState, ROWS, COLS, mapLayout, resetRound } from './state.js';
import { keys } from './input.js';
import { playWaka, startPowerSiren, stopPowerSiren, playEatGhost, playDeath, playWin, playGameOver } from './audio.js';

const { vec3 } = window.glMatrix;

function isWall(x, z) {
    let c = Math.round(x + COLS/2 - 0.5);
    let r = Math.round(z + ROWS/2 - 0.5);
    if(r < 0 || r >= ROWS || c < 0 || c >= COLS) return true; 
    return mapLayout[r][c] === 1;
}

function checkCollision(x, z, radius) {
    if(isWall(x, z)) return true;
    const r = radius; 
    if(isWall(x + r, z)) return true;
    if(isWall(x - r, z)) return true;
    if(isWall(x, z + r)) return true;
    if(isWall(x, z - r)) return true;
    return false;
}

function lerpAngle(a, b, t) {
    let diff = b - a;
    while (diff > Math.PI) diff -= 2 * Math.PI;
    while (diff < -Math.PI) diff += 2 * Math.PI;
    return a + diff * t;
}

export function update(dt) {
    // 1. UPDATE INVINCIBILITY TIMERS
    if (pacman.invincibleTimer > 0) pacman.invincibleTimer -= dt;
    ghosts.forEach(g => {
        if (g.invincibleTimer > 0) g.invincibleTimer -= dt;
    });

    if (gameState.hitPause > 0) {
        gameState.hitPause -= dt;
        return; 
    }

    if (gameState.freeze || gameState.gameWon) {
        stopPowerSiren();
        if (gameState.freeze && !gameState.gameWon) {
             gameState.freezeTimer -= dt;
             
             // FIX: Only auto-restart round if we have lives left.
             // If lives == 0, we stay frozen until the user clicks "Try Again".
             if(gameState.freezeTimer <= 0 && gameState.lives > 0) {
                 resetRound();
             }
        }
        return;
    }

    pacman.mouthPhase += dt * 15;

    let input = null;
    if(keys['ArrowUp']) input=[0,-1]; 
    else if(keys['ArrowDown']) input=[0,1];
    else if(keys['ArrowLeft']) input=[-1,0]; 
    else if(keys['ArrowRight']) input=[1,0];

    if(input) vec3.set(pacman.nextDir, input[0], 0, input[1]);

    let cx = Math.round(pacman.pos[0]);
    let cz = Math.round(pacman.pos[2]);
    let distToCenter = Math.abs(pacman.pos[0] - cx) + Math.abs(pacman.pos[2] - cz);

    if (distToCenter < 0.25) { 
        let testX = pacman.pos[0] + pacman.nextDir[0] * 0.4;
        let testZ = pacman.pos[2] + pacman.nextDir[2] * 0.4;
        if (!checkCollision(testX, testZ, 0.35)) {
            vec3.copy(pacman.dir, pacman.nextDir);
            if(pacman.dir[0]!==0) pacman.pos[2] = cz;
            if(pacman.dir[2]!==0) pacman.pos[0] = cx;
        }
    }

    let targetRotation = Math.atan2(pacman.dir[0], pacman.dir[2]);
    pacman.currentRotation = lerpAngle(pacman.currentRotation, targetRotation, dt * 10);

    let speed = pacman.speed * dt;
    let newX = pacman.pos[0] + pacman.dir[0] * speed;
    let newZ = pacman.pos[2] + pacman.dir[2] * speed;

    if (!checkCollision(newX, newZ, 0.35)) {
        pacman.pos[0] = newX;
        pacman.pos[2] = newZ;
    } 

    if(pacman.jumping) {
        pacman.jumpTime += dt;
        let t = pacman.jumpTime / pacman.jumpDur;
        if(t>=1) { pacman.jumping=false; pacman.pos[1]=0; }
        else pacman.pos[1] = Math.sin(t*Math.PI) * 1.8;
    } else pacman.pos[1] = 0;

    let dotsRemaining = false;
    if(pacman.pos[1] < 0.5) { 
        for(let d of gameState.dots) {
            if(d.active) {
                dotsRemaining = true;
                let dx=pacman.pos[0]-d.x, dz=pacman.pos[2]-d.z;
                if(dx*dx+dz*dz < 0.25) {
                    d.active=false;
                    playWaka();
                    if(d.big) { 
                        gameState.score+=50; 
                        gameState.ghostEdibleTimer=8.0; 
                        startPowerSiren();
                    } else { 
                        gameState.score+=10; 
                    }
                    dotsRemaining = gameState.dots.some(dot => dot.active);
                }
            }
        }
    } else {
        dotsRemaining = gameState.dots.some(dot => dot.active);
    }
    
    if (!dotsRemaining) {
        gameState.gameWon = true;
        gameState.freeze = true;
        playWin();
    }

    if(gameState.ghostEdibleTimer>0) {
        gameState.ghostEdibleTimer-=dt;
        if(gameState.ghostEdibleTimer <= 0) {
            stopPowerSiren();
        }
    }

    ghosts.forEach(g => {
        if (g.state === 'DEAD') {
            let targetX = 0; let targetZ = 2; 
            let dx = targetX - g.pos[0];
            let dz = targetZ - g.pos[2];
            let dist = Math.hypot(dx, dz);
            
            if (dist < 0.5) {
                // GHOST RESPAWN LOGIC
                g.state = 'ALIVE';
                vec3.set(g.dir, 0,0,1);
                // Make Ghost invincible for 3 seconds upon respawn
                g.invincibleTimer = 3.0;
            } else {
                let moveSpd = g.speed * 3.0 * dt; 
                g.pos[0] += (dx / dist) * moveSpd;
                g.pos[2] += (dz / dist) * moveSpd;
                g.dir[0] = dx; g.dir[2] = dz;
            }
            return; 
        }

        let spd = gameState.ghostEdibleTimer > 0 ? g.speed * 0.6 : g.speed;
        let moveDist = spd * dt;

        if (Math.abs(g.dir[0]) > 0.5) g.pos[2] = Math.round(g.pos[2]);
        else g.pos[0] = Math.round(g.pos[0]);

        let nextX = g.pos[0] + g.dir[0] * moveDist;
        let nextZ = g.pos[2] + g.dir[2] * moveDist;

        if (checkCollision(nextX, nextZ, 0.3)) {
            g.pos[0] = Math.round(g.pos[0]);
            g.pos[2] = Math.round(g.pos[2]);

            let dirs = [[1,0], [-1,0], [0,1], [0,-1]];
            let valid = dirs.filter(d => !checkCollision(g.pos[0] + d[0], g.pos[2] + d[1], 0.1));
            let forward = valid.filter(d => d[0] !== -g.dir[0] || d[1] !== -g.dir[2]);
            
            if (forward.length > 0) {
                let p = forward[Math.floor(Math.random() * forward.length)];
                vec3.set(g.dir, p[0], 0, p[1]);
            } else if (valid.length > 0) {
                let p = valid[0];
                vec3.set(g.dir, p[0], 0, p[1]);
            } else {
                vec3.scale(g.dir, g.dir, -1);
            }
        } else {
            g.pos[0] = nextX;
            g.pos[2] = nextZ;
            if(Math.abs(g.pos[0] - Math.round(g.pos[0])) < 0.05 && 
               Math.abs(g.pos[2] - Math.round(g.pos[2])) < 0.05 && 
               Math.random() < 0.02) {
                let dirs = [[1,0], [-1,0], [0,1], [0,-1]];
                let valid = dirs.filter(d => !checkCollision(g.pos[0] + d[0], g.pos[2] + d[1], 0.1));
                valid = valid.filter(d => d[0] !== -g.dir[0] || d[1] !== -g.dir[2]);
                if(valid.length > 0) {
                    let p = valid[Math.floor(Math.random() * valid.length)];
                    vec3.set(g.dir, p[0], 0, p[1]);
                    g.pos[0] = Math.round(g.pos[0]);
                    g.pos[2] = Math.round(g.pos[2]);
                }
            }
        }

        // --- GHOST / PACMAN COLLISION ---
        // NEW: Ignore collision if either is invincible
        if (pacman.invincibleTimer > 0 || g.invincibleTimer > 0) {
            return;
        }

        let distSq = (g.pos[0]-pacman.pos[0])**2 + (g.pos[2]-pacman.pos[2])**2;
        if(distSq < 0.6 && pacman.pos[1] < 0.8) {
            if(gameState.ghostEdibleTimer > 0) {
                gameState.score += 200;
                gameState.hitPause = 0.5; 
                g.state = 'DEAD';
                playEatGhost();
            } else {
                gameState.lives--;
                gameState.freeze = true; 
                gameState.freezeTimer = 2.0;
                stopPowerSiren();
                
                if (gameState.lives <= 0) {
                    playGameOver();
                } else {
                    playDeath();
                }
            }
        }
    });
}
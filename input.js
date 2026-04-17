export const keys = {};

export function initInput(pacman, gameState) {
    window.onkeydown = (e) => {
        keys[e.key] = true;
        if(e.key === ' ' && !pacman.jumping && !gameState.freeze) {
            pacman.jumping = true; 
            pacman.jumpTime = 0;
        }
        if(e.key.toLowerCase() === 'v') {
            gameState.shearView = !gameState.shearView;
        }
    };
    window.onkeyup = (e) => keys[e.key] = false;
}
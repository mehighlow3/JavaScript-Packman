// Audio system state
let audioCtx = null;
let soundEnabled = true;
let powerSirenOsc = null;
let sirenInterval = null;

// Initialize audio context and enable sound toggle
export function initAudio() {
    window.addEventListener('keydown', (e) => {
        if (e.key.toLowerCase() === 's') {
            soundEnabled = !soundEnabled;
            console.log("Sound Enabled:", soundEnabled);
        }

        if (!audioCtx) {
            audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        }

        if (audioCtx.state === 'suspended') {
            audioCtx.resume();
        }
    });
}

// Play a single tone with fade-out
function playTone(freq, type, duration, startTime = 0) {
    if (!soundEnabled || !audioCtx) return;

    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, audioCtx.currentTime + startTime);

    osc.connect(gain);
    gain.connect(audioCtx.destination);

    osc.start(audioCtx.currentTime + startTime);

    gain.gain.setValueAtTime(0.1, audioCtx.currentTime + startTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + startTime + duration);

    osc.stop(audioCtx.currentTime + startTime + duration);
}

// Pac-Man waka-waka step sound
export function playWaka() {
    if (!soundEnabled || !audioCtx) return;
    playTone(200, 'triangle', 0.1);
    playTone(350, 'triangle', 0.1, 0.1);
}

// Start looping siren for power mode
export function startPowerSiren() {
    if (!soundEnabled || !audioCtx) return;
    if (powerSirenOsc) return;

    powerSirenOsc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    powerSirenOsc.type = 'sine';
    powerSirenOsc.frequency.setValueAtTime(600, audioCtx.currentTime);

    powerSirenOsc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.value = 0.05;

    powerSirenOsc.start();

    // Clear any previous interval
    if (sirenInterval) {
        clearInterval(sirenInterval);
        sirenInterval = null;
    }

    // Looping pitch movement
    sirenInterval = setInterval(() => {
        if (powerSirenOsc && audioCtx) {
            const t = audioCtx.currentTime;
            powerSirenOsc.frequency.setValueAtTime(600, t);
            powerSirenOsc.frequency.linearRampToValueAtTime(800, t + 0.2);
            powerSirenOsc.frequency.linearRampToValueAtTime(600, t + 0.4);
        }
    }, 400);
}

// Stop looping power siren
export function stopPowerSiren() {
    if (powerSirenOsc) {
        powerSirenOsc.stop();
        powerSirenOsc.disconnect();
        powerSirenOsc = null;
    }

    if (sirenInterval) {
        clearInterval(sirenInterval);
        sirenInterval = null;
    }
}

// Ghost eaten sound
export function playEatGhost() {
    if (!soundEnabled || !audioCtx) return;

    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    osc.type = 'square';
    osc.frequency.setValueAtTime(800, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(2000, audioCtx.currentTime + 0.1);

    osc.connect(gain);
    gain.connect(audioCtx.destination);

    gain.gain.value = 0.1;

    osc.start();
    osc.stop(audioCtx.currentTime + 0.1);
}

// Pac-Man death sound
export function playDeath() {
    if (!soundEnabled || !audioCtx) return;

    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(500, audioCtx.currentTime);
    osc.frequency.linearRampToValueAtTime(50, audioCtx.currentTime + 1.0);

    osc.connect(gain);
    gain.connect(audioCtx.destination);

    gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
    gain.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 1.0);

    osc.start();
    osc.stop(audioCtx.currentTime + 1.0);
}

// Win melody sequence
export function playWin() {
    if (!soundEnabled || !audioCtx) return;

    const seq = [440, 554, 659, 880, 554, 659];
    seq.forEach((freq, i) => {
        playTone(freq, 'square', 0.2, i * 0.15);
    });
}

// Game Over descending tones
export function playGameOver() {
    if (!soundEnabled || !audioCtx) return;

    const tones = [300, 250, 200, 150];
    tones.forEach((freq, i) => {
        playTone(freq, 'sawtooth', 0.4, i * 0.4);
    });

    playTone(50, 'square', 1.5, 1.6);
}

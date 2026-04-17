// Import shader programs and mesh generators
import { createProgram } from './utils.js';
import { vsPhong, fsPhong, vsShadow, fsShadow } from './shaders.js';
import { createSphere, createCube, createGhostMesh, createPlane, createRetroWall } from './geometry.js';

const { mat4, vec3 } = window.glMatrix;

// Global GL references and shader programs
let gl, progPhong, progShadow, meshes;

// Normalized light direction
const lightDir = vec3.fromValues(0.5, 1.5, 0.8);
vec3.normalize(lightDir, lightDir);

// Common matrices
const mModel = mat4.create();
const mView = mat4.create();
const mProj = mat4.create();
const mViewProj = mat4.create();

// Initialize renderer and create all mesh objects
export function initRenderer(context) {
    gl = context;
    progPhong = createProgram(gl, vsPhong, fsPhong);
    progShadow = createProgram(gl, vsShadow, fsShadow);

    meshes = {
        pacman: createSphere(gl, 0.4, 24, 24),
        ghost: createGhostMesh(gl),
        wall: createRetroWall(gl),
        dot: createSphere(gl, 0.08, 8, 8),
        bigDot: createSphere(gl, 0.2, 12, 12),
        floor: createPlane(gl, 40, 40),
        eye: createSphere(gl, 0.075, 12, 12),
        pupil: createSphere(gl, 0.032, 8, 8),
        // NEW: Cube for stick figure limbs and Sphere for Sky
        limb: createCube(gl, 1.0, 1.0, 1.0),
        sky: createSphere(gl, 1.0, 24, 24)
    };
}

// Update ghost vertices for simple wobble animation
function updateGhostAnimation(pacman) {
    const mesh = meshes.ghost;
    const v = mesh.originalVerts;
    const time = pacman.mouthPhase * 2.5;
    const posData = new Float32Array(v.length);
    posData.set(v);

    const seg = 16;

    for (let i = 0; i <= seg; i++) {
        let idx = (i * 2) * 3;
        let ox = v[idx];
        let oy = v[idx + 1];
        let oz = v[idx + 2];

        let stride = 0.12;
        let walkSwing = Math.sin(time) * (ox * 2.0) * stride;

        posData[idx + 2] = oz + walkSwing;
        posData[idx + 1] = oy + Math.abs(Math.cos(time)) * 0.02;
    }

    gl.bindBuffer(gl.ARRAY_BUFFER, mesh.pos);
    gl.bufferData(gl.ARRAY_BUFFER, posData, gl.DYNAMIC_DRAW);
}

// Helper: Draw a dancing stick figure
function drawDancingFigure(pos, rotationY, pacman, gameState) {
    const time = Date.now() * 0.01;
    const color = [0.0, 1.0, 0.2]; // Neon Green
    const thickness = 0.04;
    
    // 1. Draw Torso
    drawMesh(meshes.limb, pos, [thickness, 0.25, thickness], color, 4, pacman, gameState, rotationY);

    // 2. Draw Head (offset up)
    let headPos = vec3.clone(pos);
    headPos[1] += 0.3; 
    drawMesh(meshes.dot, headPos, [1.2, 1.2, 1.2], color, 4, pacman, gameState, rotationY);

    // Helper to draw a rotating limb
    const drawLimb = (offsetX, offsetY, angleOffset, speed) => {
        const length = 0.2;
        const swing = Math.sin(time * speed + angleOffset) * 0.8; 

        // Pivot point (Shoulder/Hip)
        let pivot = vec3.fromValues(offsetX, offsetY, 0);
        vec3.rotateY(pivot, pivot, [0,0,0], rotationY);
        vec3.add(pivot, pivot, pos);

        // Limb center position logic
        let limbCenter = vec3.fromValues(0, -length/2, 0); 
        vec3.rotateX(limbCenter, limbCenter, [0,0,0], swing); // Rotate locally
        vec3.rotateY(limbCenter, limbCenter, [0,0,0], rotationY); // Rotate globally
        vec3.add(limbCenter, limbCenter, pivot);

        // Draw limb with rotationX = swing
        drawMesh(meshes.limb, limbCenter, [thickness, length, thickness], color, 4, pacman, gameState, rotationY, swing);
    };

    // 3. Draw Limbs
    drawLimb(-0.1,  0.15, 0, 1.5);       // Left Arm
    drawLimb( 0.1,  0.15, Math.PI, 1.5); // Right Arm
    drawLimb(-0.06, -0.25, Math.PI, 0.8);// Left Leg
    drawLimb( 0.06, -0.25, 0, 0.8);      // Right Leg
}

// Draw a mesh with shadow pass + main shading pass
function drawMesh(mesh, pos, scale, color, type, pacman, gameState, rotationY = 0, rotationX = 0) {
    mat4.identity(mModel);
    mat4.translate(mModel, mModel, pos);

    if (rotationY !== 0) mat4.rotateY(mModel, mModel, rotationY);
    if (rotationX !== 0) mat4.rotateX(mModel, mModel, rotationX);

    mat4.scale(mModel, mModel, scale);

    if (type === 1) gl.disable(gl.CULL_FACE);

    // Shadow pass
    // CHANGED: Added '&& type !== 5' so Eyes and Sky don't cast shadows
    if (type !== 2 && type !== 0 && type !== 5) {
        gl.enable(gl.BLEND);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
        gl.depthMask(false);

        gl.useProgram(progShadow);
        mat4.multiply(mViewProj, mProj, mView);
        gl.uniformMatrix4fv(gl.getUniformLocation(progShadow, "uModel"), false, mModel);
        gl.uniformMatrix4fv(gl.getUniformLocation(progShadow, "uViewProj"), false, mViewProj);
        gl.uniform3fv(gl.getUniformLocation(progShadow, "uLightDir"), lightDir);

        gl.bindBuffer(gl.ARRAY_BUFFER, mesh.pos);
        gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(0);

        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, mesh.ibo);
        gl.drawElements(gl.TRIANGLES, mesh.count, gl.UNSIGNED_SHORT, 0);

        gl.depthMask(true);
        gl.disable(gl.BLEND);
    }

    // Phong shading pass
    gl.useProgram(progPhong);

    gl.uniformMatrix4fv(gl.getUniformLocation(progPhong, "uModel"), false, mModel);
    gl.uniformMatrix4fv(gl.getUniformLocation(progPhong, "uView"), false, mView);
    gl.uniformMatrix4fv(gl.getUniformLocation(progPhong, "uProj"), false, mProj);

    gl.uniform3fv(gl.getUniformLocation(progPhong, "uLightDir"), lightDir);
    gl.uniform3fv(gl.getUniformLocation(progPhong, "uViewPos"), [pacman.pos[0], 10, pacman.pos[2] + 10]);
    gl.uniform3fv(gl.getUniformLocation(progPhong, "uBaseColor"), color);
    gl.uniform1i(gl.getUniformLocation(progPhong, "uType"), type);

    if (type === 1) {
        gl.uniform1f(gl.getUniformLocation(progPhong, "uMouthAngle"), 0.5 + 0.5 * Math.sin(pacman.mouthPhase));
    }
    if (type === 3) {
        gl.uniform1i(gl.getUniformLocation(progPhong, "uGhostEdible"), gameState.ghostEdibleTimer > 0 ? 1 : 0);
    }

    gl.bindBuffer(gl.ARRAY_BUFFER, mesh.pos);
    gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(0);

    gl.bindBuffer(gl.ARRAY_BUFFER, mesh.norm);
    gl.vertexAttribPointer(1, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(1);

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, mesh.ibo);
    gl.drawElements(gl.TRIANGLES, mesh.count, gl.UNSIGNED_SHORT, 0);

    if (type === 1) gl.enable(gl.CULL_FACE);
}

// Main render loop
export function render(pacman, ghosts, gameState) {
    gl.clearColor(0.1, 0.1, 0.12, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    updateGhostAnimation(pacman);

    let cx = pacman.pos[0];
    let cz = pacman.pos[2];

    // Main camera or isometric shear camera
    if (gameState.shearView) {
        mat4.perspective(mProj, Math.PI / 4.5, gl.canvas.width / gl.canvas.height, 1, 100);
        mat4.lookAt(mView, [cx, 14, cz + 12], [cx, 0, cz], [0, 1, 0]);
        const shear = mat4.create();
        shear[8] = -0.3;
        mat4.multiply(mView, shear, mView);
    } else {
        mat4.perspective(mProj, Math.PI / 3, gl.canvas.width / gl.canvas.height, 0.1, 100);
        mat4.lookAt(mView, [cx, 12, cz + 10], [cx, 0, cz], [0, 1, 0]);
    }

    // --- NEW: Sky Background Animation ---
    // Disable culling so we see the inside of the sphere
    gl.disable(gl.CULL_FACE);
    const skyTime = Date.now() * 0.0002;
    // Type 5 (Eye) is Unlit, so it renders flat neon color regardless of light
    drawMesh(meshes.sky, [0,0,0], [60,60,60], [0.1, 0.05, 0.2], 5, pacman, gameState, skyTime);
    gl.enable(gl.CULL_FACE);

    // Floor
    drawMesh(meshes.floor, [0, -0.05, 0], [1, 1, 1], [1, 1, 1], 2, pacman, gameState);

    // Walls
    gameState.walls.forEach((w, index) => {
        // Draw the physical wall
        drawMesh(meshes.wall, [w.x, 0.25, w.z], [1, 1, 1], [0, 0, 0], 0, pacman, gameState);

        // --- NEW: Dancing Stick Figures ---
        // Place one on every 7th wall block
        if (index % 7 === 0) {
            drawDancingFigure([w.x, 0.6, w.z + 0.55], 0, pacman, gameState);
        }
    });

    // Dots
    gameState.dots.forEach(d => {
        if (!d.active) return;
        if (d.big)
            drawMesh(meshes.bigDot, [d.x, 0.6, d.z], [1, 1, 1], [1, 0.9, 0.2], 4, pacman, gameState);
        else
            drawMesh(meshes.dot, [d.x, 0.5, d.z], [1, 1, 1], [0.9, 0.8, 0.6], 4, pacman, gameState);
    });

    const FLOAT_HEIGHT = 0.6;
    let pacPos = vec3.clone(pacman.pos);
    pacPos[1] += FLOAT_HEIGHT;

    // Pacman blinking on death
    const shouldBlink = (Date.now() % 200) < 100;
    const isDying = gameState.freeze && !gameState.gameWon;
    const visible = !isDying || shouldBlink;

    // Draw Pacman + eyes
    if (visible) {
        drawMesh(meshes.pacman, pacPos, [1, 1, 1], [1.0, 0.9, 0.0], 1, pacman, gameState, pacman.currentRotation);

        let mouthOpen = 0.5 + 0.5 * Math.sin(pacman.mouthPhase);
        let jawAngle = -mouthOpen * 0.6;

        let eyeL = vec3.fromValues(-0.15, 0.25, 0.38);
        let eyeR = vec3.fromValues(0.15, 0.25, 0.38);

        vec3.rotateX(eyeL, eyeL, [0, 0, 0], jawAngle);
        vec3.rotateX(eyeR, eyeR, [0, 0, 0], jawAngle);
        vec3.rotateY(eyeL, eyeL, [0, 0, 0], pacman.currentRotation);
        vec3.rotateY(eyeR, eyeR, [0, 0, 0], pacman.currentRotation);

        vec3.add(eyeL, eyeL, pacPos);
        vec3.add(eyeR, eyeR, pacPos);

        drawMesh(meshes.eye, eyeL, [1, 1, 1], [0, 0, 0], 5, pacman, gameState);
        drawMesh(meshes.eye, eyeR, [1, 1, 1], [0, 0, 0], 5, pacman, gameState);
    }

    // Draw ghosts + eyes + pupils
    ghosts.forEach(g => {
        let gp = vec3.clone(g.pos);
        gp[1] += FLOAT_HEIGHT + 0.4;

        if (g.invincibleTimer > 0 && !shouldBlink) return;

        if (g.state === 'ALIVE') {
            drawMesh(meshes.ghost, gp, [1, 1, 1], g.color, 3, pacman, gameState);
        }

        let dx = pacPos[0] - gp[0];
        let dy = pacPos[1] - gp[1];
        let dz = pacPos[2] - gp[2];

        let yaw = Math.atan2(dx, dz);
        let distXZ = Math.hypot(dx, dz);
        let pitch = -Math.atan2(dy, distXZ);

        let wL = vec3.fromValues(-0.13, 0.15, 0.45);
        let wR = vec3.fromValues(0.13, 0.15, 0.45);

        vec3.rotateX(wL, wL, [0, 0, 0], pitch);
        vec3.rotateX(wR, wR, [0, 0, 0], pitch);
        vec3.rotateY(wL, wL, [0, 0, 0], yaw);
        vec3.rotateY(wR, wR, [0, 0, 0], yaw);

        vec3.add(wL, wL, gp);
        vec3.add(wR, wR, gp);

        drawMesh(meshes.eye, wL, [1.2, 1.2, 1.2], [1, 1, 1], 5, pacman, gameState);
        drawMesh(meshes.eye, wR, [1.2, 1.2, 1.2], [1, 1, 1], 5, pacman, gameState);

        let pOff = vec3.fromValues(0, 0, 0.076);
        vec3.rotateX(pOff, pOff, [0, 0, 0], pitch);
        vec3.rotateY(pOff, pOff, [0, 0, 0], yaw);

        let pupL = vec3.create();
        let pupR = vec3.create();
        vec3.add(pupL, wL, pOff);
        vec3.add(pupR, wR, pOff);

        drawMesh(meshes.pupil, pupL, [1, 1, 1], [0, 0, 0.8], 5, pacman, gameState);
        drawMesh(meshes.pupil, pupR, [1, 1, 1], [0, 0, 0.8], 5, pacman, gameState);
    });
}
# PacMania: A 3D WebGL Pac-Man Implementation

PacMania is a high-performance 3D implementation of the classic arcade game, built from the ground up using vanilla JavaScript and raw WebGL. The project bypasses high-level libraries like Three.js to demonstrate deep expertise in graphics programming, GLSL shaders, and game engine architecture.

## Technical Features

### Graphics & Rendering Pipeline

- **Custom WebGL Engine:** Developed a modular rendering system using raw WebGL APIs for buffer management, shader linking, and draw call optimization.
- **Phong Shading Model:** Implemented a per-fragment shading pass supporting ambient, diffuse, and specular components with a dynamic directional light source.
- **Dynamic Shadow Projection:** Engineered a shadow pass that projects object geometry onto a ground plane ($y = 0.01$) using a specialized projection matrix logic.
- **Vertex Animation:** Created a procedural wobble for ghosts and a dynamic clipping-plane based mouth animation for Pac-Man, synchronized with his movement phase.

### Mathematics & Camera Systems

- **Isometric Shear View:** Implemented a toggleable shear-view camera by manually manipulating the view-projection matrix to achieve a classic 2.5D retro perspective.
- **Smooth Rotational Interpolation:** Utilized `lerpAngle` logic and `gl-matrix` for smooth, frame-rate independent orientation of Pac-Man as he navigates the labyrinth.
- **Procedural Geometry:** Custom functions to generate 3D meshes for spheres, cubes, and the "retro wall" layout directly into typed arrays.

### Gameplay & AI Logic

- **Grid-Based Navigation:** A robust collision detection system that manages boundaries within a 19x15 labyrinth layout.
- **Multi-State Ghost AI:** Four unique ghosts featuring independent states (`ALIVE`, `DEAD`, `EDIBLE`) and dynamic behavior patterns.
- **Jump Mechanic:** A parabolic jump function using sine-wave displacement, allowing Pac-Man to temporarily avoid ghost collisions.
- **Invincibility & Respawn:** Implemented a 3-second invincibility grace period with blinking feedback logic for both Pac-Man and respawning ghosts.

### Procedural Audio System

- **Web Audio API:** Sounds are generated procedurally (no MP3 files) using oscillators and gain nodes.
- **Power Siren:** A looping frequency-ramped siren that triggers when Pac-Man enters "Power Mode."

## ⌨️ Controls & Interaction

| Key | Action |
|-----|--------|
| Arrow Keys | Navigate the maze |
| Space Bar | Jump |
| `V` | Toggle Isometric Shear View |
| `S` | Enable/Disable Sound |

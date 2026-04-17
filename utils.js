// Compile a single shader
export function createShader(gl, type, src) {
    const sh = gl.createShader(type);
    gl.shaderSource(sh, src);
    gl.compileShader(sh);

    if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
        console.error(gl.getShaderInfoLog(sh));
        throw new Error('Shader compile failed');
    }

    return sh;
}

// Create a linked shader program
export function createProgram(gl, vsSrc, fsSrc) {
    const prog = gl.createProgram();

    gl.attachShader(prog, createShader(gl, gl.VERTEX_SHADER, vsSrc));
    gl.attachShader(prog, createShader(gl, gl.FRAGMENT_SHADER, fsSrc));
    gl.linkProgram(prog);

    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
        console.error(gl.getProgramInfoLog(prog));
        throw new Error('Program link failed');
    }

    return prog;
}

// Create typed buffer
function createBuffer(gl, data, type) {
    const buf = gl.createBuffer();
    gl.bindBuffer(type, buf);
    gl.bufferData(type, data, gl.STATIC_DRAW);
    return buf;
}

// Create mesh with buffers
function createMesh(gl, v, n, i) {
    return {
        pos: createBuffer(gl, new Float32Array(v), gl.ARRAY_BUFFER),
        norm: createBuffer(gl, new Float32Array(n), gl.ARRAY_BUFFER),
        ibo: createBuffer(gl, new Uint16Array(i), gl.ELEMENT_ARRAY_BUFFER),
        count: i.length,
        originalVerts: new Float32Array(v)
    };
}

// Add box vertices and indices
function addBox(v, n, idx, x, y, z, sx, sy, sz) {
    let start = v.length / 3;
    let hx=sx/2, hy=sy/2, hz=sz/2;

    v.push(
        x-hx,y-hy,z+hz, x+hx,y-hy,z+hz, x+hx,y+hy,z+hz, x-hx,y+hy,z+hz,
        x-hx,y-hy,z-hz, x-hx,y+hy,z-hz, x+hx,y+hy,z-hz, x+hx,y-hy,z-hz,
        x-hx,y+hy,z-hz, x-hx,y+hy,z+hz, x+hx,y+hy,z+hz, x+hx,y+hy,z-hz,
        x-hx,y-hy,z-hz, x+hx,y-hy,z-hz, x+hx,y-hy,z+hz, x-hx,y-hy,z+hz,
        x+hx,y-hy,z-hz, x+hx,y+hy,z-hz, x+hx,y+hy,z+hz, x+hx,y-hy,z+hz,
        x-hx,y-hy,z-hz, x-hx,y-hy,z+hz, x-hx,y+hy,z+hz, x-hx,y+hy,z-hz
    );

    n.push(
        0,0,1,0,0,1,0,0,1,0,0,1,
        0,0,-1,0,0,-1,0,0,-1,0,0,-1,
        0,1,0,0,1,0,0,1,0,0,1,0,
        0,-1,0,0,-1,0,0,-1,0,0,-1,0,
        1,0,0,1,0,0,1,0,0,1,0,0,
        -1,0,0,-1,0,0,-1,0,0,-1,0,0
    );

    for (let k=0; k<6; k++) {
        let off=start + k*4;
        idx.push(off, off+1, off+2, off, off+2, off+3);
    }
}

// Create sphere mesh
export function createSphere(gl, r, latB, lonB) {
    const v=[], n=[], i=[];

    for (let lat=0; lat<=latB; lat++) {
        let theta = lat * Math.PI / latB;
        let sinT = Math.sin(theta);
        let cosT = Math.cos(theta);

        for (let lon=0; lon<=lonB; lon++) {
            let phi = lon * 2 * Math.PI / lonB;
            let sinP = Math.sin(phi);
            let cosP = Math.cos(phi);

            let x = cosP * sinT;
            let y = cosT;
            let z = sinP * sinT;

            v.push(r*x, r*y, r*z);
            n.push(x,y,z);
        }
    }

    for (let lat=0; lat<latB; lat++) {
        for (let lon=0; lon<lonB; lon++) {
            let first = (lat * (lonB+1)) + lon;
            let second = first + lonB + 1;
            i.push(first, second, first+1, second, second+1, first+1);
        }
    }

    return createMesh(gl, v, n, i);
}

// Create cube mesh
export function createCube(gl, sx, sy, sz) {
    const v=[], n=[], idx=[];
    addBox(v, n, idx, 0,0,0, sx,sy,sz);
    return createMesh(gl, v, n, idx);
}

// Create retro ring style wall
export function createRetroWall(gl) {
    const v=[], n=[], idx=[];
    const ringHeight=0.08, spacing=0.2, size=1.0, thickness=0.1;

    for (let level=0; level<3; level++) {
        let y = (level-1)*spacing + 0.1;

        addBox(v,n,idx,0,y,size/2-thickness/2,size,ringHeight,thickness);
        addBox(v,n,idx,0,y,-(size/2-thickness/2),size,ringHeight,thickness);
        addBox(v,n,idx,-(size/2-thickness/2),y,0,thickness,ringHeight,size-2*thickness);
        addBox(v,n,idx,(size/2-thickness/2),y,0,thickness,ringHeight,size-2*thickness);
    }

    return createMesh(gl, v, n, idx);
}

// Create ghost mesh
export function createGhostMesh(gl) {
    const v=[], n=[], idx=[];
    const r=0.4, seg=16;

    for (let i=0; i<=seg; i++) {
        let t = i * 2 * Math.PI / seg;
        let x = Math.cos(t) * r;
        let z = Math.sin(t) * r;
        let yBottom = (i % 2 === 0) ? -0.4 : -0.32;

        v.push(x,yBottom,z); n.push(x,0,z);
        v.push(x,0,z);       n.push(x,0,z);
    }

    for (let i=0; i<seg; i++) {
        let b = i*2;
        idx.push(b,b+1,b+2,b+1,b+3,b+2);
    }

    let startIdx = v.length / 3;

    for (let lat=0; lat<=8; lat++) {
        let th = lat*(Math.PI/2)/8;
        let sinT=Math.sin(th), cosT=Math.cos(th);

        for (let lon=0; lon<=seg; lon++) {
            let phi = lon*2*Math.PI/seg;
            let x = Math.cos(phi)*cosT*r;
            let y = sinT*r;
            let z = Math.sin(phi)*cosT*r;
            v.push(x,y,z);
            n.push(x,y,z);
        }
    }

    for (let lat=0; lat<8; lat++) {
        for (let lon=0; lon<seg; lon++) {
            let f = startIdx + lat*(seg+1) + lon;
            let s = f + seg + 1;
            idx.push(f,s,f+1,s,s+1,f+1);
        }
    }

    return createMesh(gl, v, n, idx);
}

// Create ground plane
export function createPlane(gl, w, d) {
    const v=[-w,0,-d, w,0,-d, w,0,d, -w,0,d];
    const n=[0,1,0,0,1,0,0,1,0,0,1,0];
    const i=[0,1,2,0,2,3];
    return createMesh(gl, v, n, i);
}

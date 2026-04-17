// VERTEX SHADER
export const vsPhong = `
attribute vec3 aPosition;
attribute vec3 aNormal;
uniform mat4 uModel;
uniform mat4 uView;
uniform mat4 uProj;
// uType/uMouthPhase removed from here to prevent crashes/conflicts

varying vec3 vNormal;
varying vec3 vWorldPos;
varying vec3 vObjPos; 

void main() {
  vec4 worldPos = uModel * vec4(aPosition, 1.0);
  vWorldPos = worldPos.xyz;
  vNormal = mat3(uModel) * aNormal;
  vObjPos = aPosition; 
  gl_Position = uProj * uView * worldPos;
}
`;

// FRAGMENT SHADER
export const fsPhong = `
precision mediump float;
varying vec3 vNormal;
varying vec3 vWorldPos;
varying vec3 vObjPos;
uniform vec3 uLightDir;
uniform vec3 uViewPos;
uniform vec3 uBaseColor;
uniform int uType; // 0=Wall, 1=Pacman, 2=Floor, 3=Ghost, 5=Eye
uniform float uMouthAngle; 
uniform int uGhostEdible;

void main() {
  // 1. Pacman Clipping
  if (uType == 1) { 
    float angle = atan(vObjPos.y, vObjPos.z); 
    if (abs(angle) < uMouthAngle) discard;
  }
  
  vec3 color = uBaseColor;
  
  // 2. WALL COLOR (Pac-Mania Blue Style)
  if (uType == 0) { 
    // Mix Metallic Blue
    vec3 colBlue = vec3(0.0, 0.25, 0.7); 
    vec3 colHighlight = vec3(0.2, 0.5, 1.0);
    // Simple gradient based on height
    float grad = smoothstep(-0.2, 0.3, vObjPos.y);
    color = mix(colBlue, colHighlight, grad);
  }
  
  // 3. FLOOR COLOR (Concrete Grey)
  if (uType == 2) { 
    color = vec3(0.3, 0.3, 0.35);
  }
  
  // 4. GHOST VULNERABLE COLOR
  // FIX: Solid Blue (No Blinking)
  if (uType == 3 && uGhostEdible == 1) { 
     color = vec3(0.5, 0.5, 1.0); 
  }

  // 5. Lighting
  vec3 N = normalize(vNormal);
  if (!gl_FrontFacing) N = -N; 

  vec3 L = normalize(-uLightDir);
  vec3 V = normalize(uViewPos - vWorldPos);
  vec3 R = reflect(-L, N);

  float diff = max(dot(N,L), 0.0);
  float spec = 0.0;
  if(diff > 0.0) {
      float specPower = (uType == 1) ? 64.0 : 16.0; 
      spec = pow(max(dot(R,V), 0.0), specPower);
  }

  vec3 ambient = 0.5 * color; 
  vec3 diffuse = 0.7 * diff * color;
  vec3 specular = (uType == 2 || uType == 5 ? 0.0 : 0.3) * spec * vec3(1.0);
  
  vec3 finalColor = ambient + diffuse + specular;

  // Eyes (uType 5) are unlit white/black
  if (uType == 5) {
      finalColor = uBaseColor;
  }
  
  gl_FragColor = vec4(finalColor, 1.0);
}
`;

// SHADOW VERTEX SHADER
export const vsShadow = `
attribute vec3 aPosition;
uniform mat4 uModel;
uniform mat4 uViewProj;
uniform vec3 uLightDir;
void main() {
  vec4 worldPos = uModel * vec4(aPosition, 1.0);
  float planeY = 0.01;
  float t = (worldPos.y - planeY) / uLightDir.y;
  vec3 shadowPos = worldPos.xyz - t * uLightDir;
  gl_Position = uViewProj * vec4(shadowPos, 1.0);
}
`;

// SHADOW FRAGMENT SHADER
export const fsShadow = `
precision mediump float;
void main() { gl_FragColor = vec4(0.0, 0.0, 0.0, 0.6); }
`;
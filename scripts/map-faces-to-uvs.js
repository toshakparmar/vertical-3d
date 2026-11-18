import fs from 'fs';
import path from 'path';

const file = path.resolve('models-input/Tent_8_8.glb');
const buffer = fs.readFileSync(file);
const chunkLength = buffer.readUInt32LE(12);
const jsonStr = buffer.toString('utf8', 20, 20 + chunkLength);
const gltf = JSON.parse(jsonStr);

const binStart = 20 + chunkLength + 8;
const mesh = gltf.meshes[0];
const prim = mesh.primitives.find((p) => gltf.materials[p.material]?.name === 'fabric_Mat');

const uvAcc = gltf.accessors[prim.attributes.TEXCOORD_0];
const uvBv = gltf.bufferViews[uvAcc.bufferView];
const uvOffset = binStart + (uvBv.byteOffset || 0) + (uvAcc.byteOffset || 0);

const posAcc = gltf.accessors[prim.attributes.POSITION];
const posBv = gltf.bufferViews[posAcc.bufferView];
const posOffset = binStart + (posBv.byteOffset || 0) + (posAcc.byteOffset || 0);

const count = posAcc.count;
const faces = {
  front: { uvs: [], uMin: 1, uMax: 0, vMin: 1, vMax: 0 },
  back: { uvs: [], uMin: 1, uMax: 0, vMin: 1, vMax: 0 },
  right: { uvs: [], uMin: 1, uMax: 0, vMin: 1, vMax: 0 },
  left: { uvs: [], uMin: 1, uMax: 0, vMin: 1, vMax: 0 },
};

for (let i = 0; i < count; i++) {
  const x = buffer.readFloatLE(posOffset + i * 12);
  const y = buffer.readFloatLE(posOffset + i * 12 + 4);
  const z = buffer.readFloatLE(posOffset + i * 12 + 8);

  const u = buffer.readFloatLE(uvOffset + i * 8);
  const v = buffer.readFloatLE(uvOffset + i * 8 + 4);

  let side = null;
  // Classify by dominant horizontal direction
  if (Math.abs(z) > Math.abs(x)) {
    side = z > 0 ? 'front' : 'back';
  } else {
    side = x > 0 ? 'right' : 'left';
  }

  if (side) {
    const f = faces[side];
    if (u < f.uMin) f.uMin = u;
    if (u > f.uMax) f.uMax = u;
    if (v < f.vMin) f.vMin = v;
    if (v > f.vMax) f.vMax = v;
    f.uvs.push({ x, y, z, u, v });
  }
}

console.log('--- UV BOUNDS PER 3D FACE ---');
for (const [name, f] of Object.entries(faces)) {
  console.log(`${name.toUpperCase()}: count=${f.uvs.length}, U=[${f.uMin.toFixed(3)} .. ${f.uMax.toFixed(3)}], V=[${f.vMin.toFixed(3)} .. ${f.vMax.toFixed(3)}]`);
}

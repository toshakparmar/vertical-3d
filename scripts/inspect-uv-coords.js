import fs from 'fs';
import path from 'path';

const file = path.resolve('models-input/Tent_8_8.glb');
const buffer = fs.readFileSync(file);
const chunkLength = buffer.readUInt32LE(12);
const jsonStr = buffer.toString('utf8', 20, 20 + chunkLength);
const gltf = JSON.parse(jsonStr);

// Binary buffer start offset: 20 + chunkLength + 8 (chunk 1 header)
const binStart = 20 + chunkLength + 8;

const mesh = gltf.meshes[0];
const prim = mesh.primitives.find((p) => gltf.materials[p.material]?.name === 'fabric_Mat');
console.log('Fabric_Mat Primitive:', prim);

const uvAcc = gltf.accessors[prim.attributes.TEXCOORD_0];
const uvBufferView = gltf.bufferViews[uvAcc.bufferView];
const uvOffset = binStart + (uvBufferView.byteOffset || 0) + (uvAcc.byteOffset || 0);

console.log(`Reading ${uvAcc.count} UV coordinates...`);
let minU = Infinity, maxU = -Infinity, minV = Infinity, maxV = -Infinity;

const sampleUVs = [];
for (let i = 0; i < uvAcc.count; i++) {
  const u = buffer.readFloatLE(uvOffset + i * 8);
  const v = buffer.readFloatLE(uvOffset + i * 8 + 4);
  if (u < minU) minU = u;
  if (u > maxU) maxU = u;
  if (v < minV) minV = v;
  if (v > maxV) maxV = v;
  if (i < 10) sampleUVs.push([u.toFixed(3), v.toFixed(3)]);
}

console.log(`UV Bounds: U=[${minU.toFixed(4)} .. ${maxU.toFixed(4)}], V=[${minV.toFixed(4)} .. ${maxV.toFixed(4)}]`);
console.log('Sample UVs:', sampleUVs);


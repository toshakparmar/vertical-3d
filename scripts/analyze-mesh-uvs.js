import fs from 'fs';
import path from 'path';

const file = path.resolve('models-input/Tent_8_8.glb');
const buffer = fs.readFileSync(file);
const chunkLength = buffer.readUInt32LE(12);
const jsonStr = buffer.toString('utf8', 20, 20 + chunkLength);
const gltf = JSON.parse(jsonStr);

console.log(`Analyzing Mesh & Accessors for ${file}...`);

// Find the fabric mesh and its primitives
const fabricNode = gltf.nodes.find((n) => n.name === 'fabric');
console.log('Fabric Node:', fabricNode);

const meshIndex = fabricNode.mesh;
const mesh = gltf.meshes[meshIndex];
console.log('Mesh Primitives:', mesh.primitives.length);

mesh.primitives.forEach((prim, idx) => {
  const mat = gltf.materials[prim.material];
  console.log(`\nPrimitive ${idx}: Material = ${mat.name}`);
  const uvAccessorIdx = prim.attributes.TEXCOORD_0;
  if (uvAccessorIdx !== undefined) {
    const acc = gltf.accessors[uvAccessorIdx];
    console.log(`UV0 Accessor [${uvAccessorIdx}]: count=${acc.count}, min=[${acc.min}], max=[${acc.max}], type=${acc.type}`);
  }
  const posAccessorIdx = prim.attributes.POSITION;
  if (posAccessorIdx !== undefined) {
    const acc = gltf.accessors[posAccessorIdx];
    console.log(`POS Accessor [${posAccessorIdx}]: count=${acc.count}, min=[${acc.min}], max=[${acc.max}]`);
  }
});

import fs from 'fs';
import path from 'path';

const file = path.resolve('models-input/Tent_8_8.glb');
const buffer = fs.readFileSync(file);
const chunkLength = buffer.readUInt32LE(12);
const jsonStr = buffer.toString('utf8', 20, 20 + chunkLength);
const gltf = JSON.parse(jsonStr);

console.log('Images in GLB:', gltf.images?.length);
gltf.images?.forEach((img, idx) => {
  console.log(`Image [${idx}]: name="${img.name}", mimeType="${img.mimeType}", bufferView=${img.bufferView}`);
});

console.log('\nMaterials:');
gltf.materials?.forEach((mat, idx) => {
  console.log(`Mat [${idx}]: name="${mat.name}"`, mat.pbrMetallicRoughness);
});


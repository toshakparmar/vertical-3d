import fs from 'fs';
import path from 'path';

const file = path.resolve('models-input/Tent_8_8.glb');
const buffer = fs.readFileSync(file);
const chunkLength = buffer.readUInt32LE(12);
const jsonStr = buffer.toString('utf8', 20, 20 + chunkLength);
const gltf = JSON.parse(jsonStr);

const binStart = 20 + chunkLength + 8;
const img = gltf.images[1]; // fabric_Mat_BaseColor
const bv = gltf.bufferViews[img.bufferView];
const imgOffset = binStart + (bv.byteOffset || 0);
const imgLength = bv.byteLength;

const imgBuf = buffer.subarray(imgOffset, imgOffset + imgLength);
fs.mkdirSync('docs/extracted', { recursive: true });
fs.writeFileSync('docs/extracted/fabric_Mat_BaseColor.png', imgBuf);

console.log(`Extracted fabric_Mat_BaseColor.png (${(imgBuf.length / 1024).toFixed(1)} KB)`);

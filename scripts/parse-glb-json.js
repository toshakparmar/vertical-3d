import fs from 'fs';
import path from 'path';

const inputDir = path.resolve('models-input');
const files = fs.readdirSync(inputDir).filter((f) => f.endsWith('.glb'));

console.log(`Inspecting GLBs in ${inputDir}...`);

for (const file of files) {
  const filePath = path.join(inputDir, file);
  const buffer = fs.readFileSync(filePath);

  const magic = buffer.readUInt32LE(0);
  const version = buffer.readUInt32LE(4);
  const length = buffer.readUInt32LE(8);

  const chunkLength = buffer.readUInt32LE(12);
  const chunkType = buffer.readUInt32LE(16);

  if (chunkType !== 0x4e4f534a) {
    console.error(`File ${file} does not have JSON chunk at offset 12!`);
    continue;
  }

  const jsonStr = buffer.toString('utf8', 20, 20 + chunkLength);
  const gltf = JSON.parse(jsonStr);

  console.log(`\n========================================`);
  console.log(`File: ${file} (${(buffer.length / 1024 / 1024).toFixed(2)} MB)`);
  console.log(`GLB Version: ${version}`);
  console.log(`Nodes: ${gltf.nodes?.length || 0}`);
  console.log(`Meshes: ${gltf.meshes?.length || 0}`);
  console.log(`Materials: ${gltf.materials?.length || 0}`);
  console.log(`Textures: ${gltf.textures?.length || 0}`);

  console.log(`\n--- NODES ---`);
  gltf.nodes?.forEach((n, i) => {
    console.log(`Node [${i}]: name="${n.name}", meshIndex=${n.mesh !== undefined ? n.mesh : 'none'}`);
  });

  console.log(`\n--- MESHES & PRIMITIVES ---`);
  gltf.meshes?.forEach((m, i) => {
    console.log(`Mesh [${i}]: name="${m.name}"`);
    m.primitives?.forEach((p, pi) => {
      const matName = p.material !== undefined ? gltf.materials[p.material]?.name : 'default';
      const hasPos = p.attributes.POSITION !== undefined;
      const hasNormal = p.attributes.NORMAL !== undefined;
      const hasUV0 = p.attributes.TEXCOORD_0 !== undefined;
      const hasUV1 = p.attributes.TEXCOORD_1 !== undefined;
      console.log(`  Prim [${pi}]: material="${matName}", POS=${hasPos}, NORMAL=${hasNormal}, UV0=${hasUV0}, UV1=${hasUV1}`);
    });
  });

  console.log(`\n--- MATERIALS ---`);
  gltf.materials?.forEach((mat, i) => {
    console.log(`Material [${i}]: name="${mat.name}"`);
  });

  // Save the full JSON metadata for docs
  fs.mkdirSync('docs/glb-json', { recursive: true });
  fs.writeFileSync(`docs/glb-json/${file}.json`, JSON.stringify(gltf, null, 2));
}

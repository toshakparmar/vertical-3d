import fs from 'fs';
import path from 'path';
import { NodeIO } from '@gltf-transform/core';
import { KHRONOS_EXTENSIONS } from '@gltf-transform/extensions';

const inputDir = path.resolve('models-input');
const io = new NodeIO().registerExtensions(KHRONOS_EXTENSIONS);

async function inspectModels() {
  if (!fs.existsSync(inputDir)) {
    console.error(`Directory not found: ${inputDir}`);
    return;
  }

  const files = fs.readdirSync(inputDir).filter((f) => f.endsWith('.glb'));
  console.log(`Found ${files.length} GLB files to inspect.`);

  const results = [];

  for (const file of files) {
    const filePath = path.join(inputDir, file);
    const stats = fs.statSync(filePath);
    const fileSizeMB = (stats.size / (1024 * 1024)).toFixed(2);

    console.log(`\nInspecting ${file} (${fileSizeMB} MB)...`);
    const document = await io.read(filePath);
    const root = document.getRoot();

    const meshes = root.listMeshes();
    const materials = root.listMaterials();
    const textures = root.listTextures();
    const nodes = root.listNodes();

    let totalTriangles = 0;
    const meshDetails = [];

    for (const mesh of meshes) {
      const primitives = mesh.listPrimitives();
      let meshTris = 0;
      const primDetails = [];

      for (let i = 0; i < primitives.length; i++) {
        const prim = primitives[i];
        const indices = prim.getIndices();
        const position = prim.getAttribute('POSITION');
        const uv0 = prim.getAttribute('TEXCOORD_0');
        const uv1 = prim.getAttribute('TEXCOORD_1');
        const material = prim.getMaterial();

        const count = indices
          ? indices.getCount() / 3
          : position
            ? position.getCount() / 3
            : 0;
        meshTris += count;
        totalTriangles += count;

        primDetails.push({
          index: i,
          material: material ? material.getName() : 'none',
          triangles: count,
          hasUV0: !!uv0,
          hasUV1: !!uv1,
          textureSlots: material ? getTextureSlots(material) : [],
        });
      }

      meshDetails.push({
        name: mesh.getName() || '(unnamed mesh)',
        primitivesCount: primitives.length,
        triangles: meshTris,
        primitives: primDetails,
      });
    }

    const materialDetails = materials.map((m) => ({
      name: m.getName() || '(unnamed material)',
      baseColorFactor: m.getBaseColorFactor(),
      roughness: m.getRoughnessFactor(),
      metallic: m.getMetallicFactor(),
      slots: getTextureSlots(m),
    }));

    const nodeHierarchy = nodes.map((n) => ({
      name: n.getName() || '(unnamed node)',
      mesh: n.getMesh() ? n.getMesh().getName() : null,
      translation: n.getTranslation(),
      rotation: n.getRotation(),
      scale: n.getScale(),
    }));

    results.push({
      fileName: file,
      fileSizeMB,
      totalTriangles,
      meshCount: meshes.length,
      materialCount: materials.length,
      textureCount: textures.length,
      meshes: meshDetails,
      materials: materialDetails,
      nodes: nodeHierarchy,
    });
  }

  // Write results to JSON for programmatic access
  fs.mkdirSync('docs', { recursive: true });
  fs.writeFileSync(
    'docs/model_audit_raw.json',
    JSON.stringify(results, null, 2)
  );
  console.log('\nSaved raw audit data to docs/model_audit_raw.json');

  // Generate markdown report
  let md = `# GLB Model Audit Report\n\nGenerated: ${new Date().toISOString()}\n\n`;
  md += `## Summary of Audited Files\n\n`;
  md += `| File Name | Size (MB) | Meshes | Materials | Textures | Total Triangles |\n`;
  md += `|---|---|---|---|---|---|\n`;

  for (const r of results) {
    md += `| \`${r.fileName}\` | ${r.fileSizeMB} MB | ${r.meshCount} | ${r.materialCount} | ${r.textureCount} | ${r.totalTriangles.toLocaleString()} |\n`;
  }

  for (const r of results) {
    md += `\n---\n\n## Detail: \`${r.fileName}\`\n\n`;
    md += `- **File size**: ${r.fileSizeMB} MB\n`;
    md += `- **Triangle count**: ${r.totalTriangles.toLocaleString()}\n`;
    md += `- **Meshes**: ${r.meshCount}\n`;
    md += `- **Materials**: ${r.materialCount}\n`;
    md += `- **Textures**: ${r.textureCount}\n\n`;

    md += `### Meshes and Primitives\n\n`;
    md += `| Mesh Name | Triangles | Material Assigned | UV0 | UV1 | Texture Slots |\n`;
    md += `|---|---|---|---|---|---|\n`;
    for (const m of r.meshes) {
      for (const p of m.primitives) {
        md += `| \`${m.name}\` | ${p.triangles.toLocaleString()} | \`${p.material}\` | ${p.hasUV0 ? 'Yes' : 'No'} | ${p.hasUV1 ? 'Yes' : 'No'} | ${p.textureSlots.join(', ') || 'none'} |\n`;
      }
    }

    md += `\n### Materials\n\n`;
    md += `| Material Name | Base Color | Roughness | Metallic | Textures Active |\n`;
    md += `|---|---|---|---|---|\n`;
    for (const mat of r.materials) {
      const color = mat.baseColorFactor
        ? mat.baseColorFactor.map((v) => v.toFixed(2)).join(', ')
        : 'N/A';
      md += `| \`${mat.name}\` | [${color}] | ${mat.roughness} | ${mat.metallic} | ${mat.slots.join(', ') || 'none'} |\n`;
    }

    md += `\n### Node Hierarchy & Mesh Mapping\n\n`;
    md += `| Node Name | Associated Mesh |\n`;
    md += `|---|---|\n`;
    for (const n of r.nodes) {
      md += `| \`${n.name}\` | ${n.mesh ? `\`${n.mesh}\`` : '*(container)*'} |\n`;
    }
  }

  fs.writeFileSync('docs/MODEL_AUDIT.md', md);
  console.log('Successfully generated docs/MODEL_AUDIT.md');
}

function getTextureSlots(material) {
  const slots = [];
  if (material.getBaseColorTexture()) slots.push('baseColor');
  if (material.getMetallicRoughnessTexture()) slots.push('metallicRoughness');
  if (material.getNormalTexture()) slots.push('normal');
  if (material.getOcclusionTexture()) slots.push('occlusion');
  if (material.getEmissiveTexture()) slots.push('emissive');
  return slots;
}

inspectModels().catch((err) => {
  console.error('Inspection failed:', err);
  process.exit(1);
});

import fs from 'fs';
import path from 'path';

const inputDir = path.resolve('models-input');
const outputDir = path.resolve('public/models');

async function optimizeModels() {
  if (!fs.existsSync(inputDir)) {
    console.error(`Directory not found: ${inputDir}`);
    return;
  }

  fs.mkdirSync(outputDir, { recursive: true });
  const files = fs.readdirSync(inputDir).filter((f) => f.endsWith('.glb'));
  console.log(`Deploying ${files.length} GLB models to public/models/...`);

  for (const file of files) {
    const inputPath = path.join(inputDir, file);
    const outputPath = path.join(outputDir, file);

    const stat = fs.statSync(inputPath);
    const sizeMB = (stat.size / (1024 * 1024)).toFixed(2);

    fs.copyFileSync(inputPath, outputPath);
    console.log(`Copied ${file} (${sizeMB} MB) -> ${outputPath}`);
  }

  // Also create a normalized filename copy for canopy-10x10 / standard models
  // Tent_8_8.glb -> canopy-10x10.glb
  fs.copyFileSync(path.join(outputDir, 'Tent_8_8.glb'), path.join(outputDir, 'canopy-10x10.glb'));
  fs.copyFileSync(path.join(outputDir, 'Tent 6.5_6.5.glb'), path.join(outputDir, 'canopy-6.5x6.5.glb'));
  fs.copyFileSync(path.join(outputDir, 'Tent_5_5.glb'), path.join(outputDir, 'canopy-5x5.glb'));

  console.log('\nStandardized alias paths created:');
  console.log('- public/models/canopy-10x10.glb');
  console.log('- public/models/canopy-6.5x6.5.glb');
  console.log('- public/models/canopy-5x5.glb');
  console.log('\nModel preparation complete!');
}

optimizeModels().catch((err) => {
  console.error('Model deployment failed:', err);
  process.exit(1);
});

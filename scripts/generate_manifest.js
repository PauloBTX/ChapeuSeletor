import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const assetsDir = path.resolve(__dirname, '../public/assets');
const outputManifest = path.resolve(__dirname, '../src/audio/manifest.json');

const files = fs.readdirSync(assetsDir);

const manifest = {
  aberturas: [],
  adjetivos: [],
  transicoes: [],
  escolhas: [],
  efeitos: []
};

for (const file of files) {
  if (!file.endsWith('.wav')) continue;

  if (file.startsWith('aberturas')) {
    manifest.aberturas.push(file);
  } else if (file.startsWith('adjetivos')) {
    manifest.adjetivos.push(file);
  } else if (file.startsWith('transicao-casa')) {
    manifest.transicoes.push(file);
  } else if (file.startsWith('escolha-')) {
    manifest.escolhas.push(file);
  } else if (file.startsWith('efeitos')) {
    manifest.efeitos.push(file);
  }
}

// Sort alphabetically / numerically
const naturalSort = (a, b) => {
  const numA = parseInt((a.match(/\d+/) || [0])[0], 10);
  const numB = parseInt((b.match(/\d+/) || [0])[0], 10);
  return numA - numB;
};

manifest.aberturas.sort(naturalSort);
manifest.adjetivos.sort(naturalSort);
manifest.transicoes.sort(naturalSort);
manifest.escolhas.sort((a, b) => a.localeCompare(b));
manifest.efeitos.sort(naturalSort);

fs.writeFileSync(outputManifest, JSON.stringify(manifest, null, 2), 'utf-8');

console.log('Manifesto de áudios gerado com sucesso:');
console.log(`- Aberturas: ${manifest.aberturas.length} arquivos`);
console.log(`- Adjetivos: ${manifest.adjetivos.length} arquivos`);
console.log(`- Transições: ${manifest.transicoes.length} arquivos`);
console.log(`- Escolhas de Casa: ${manifest.escolhas.length} arquivos`);
console.log(`- Efeitos sonoros: ${manifest.efeitos.length} arquivos`);

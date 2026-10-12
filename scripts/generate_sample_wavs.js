import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const targetDir = path.resolve(__dirname, '../public/assets');

if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true });
}

// Function to generate a simple WAV buffer
function createWavBuffer({ durationSec = 1.8, sampleRate = 22050, baseFreq = 220, type = 'bell', variation = 1 }) {
  const numChannels = 1;
  const bytesPerSample = 2; // 16-bit
  const blockAlign = numChannels * bytesPerSample;
  const byteRate = sampleRate * blockAlign;
  const numSamples = Math.floor(sampleRate * durationSec);
  const dataSize = numSamples * blockAlign;

  const buffer = Buffer.alloc(44 + dataSize);

  // RIFF identifier
  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(36 + dataSize, 4);
  buffer.write('WAVE', 8);

  // 'fmt ' sub-chunk
  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16); // SubChunk1Size (16 for PCM)
  buffer.writeUInt16LE(1, 20); // AudioFormat (1 for PCM)
  buffer.writeUInt16LE(numChannels, 22);
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(byteRate, 28);
  buffer.writeUInt16LE(blockAlign, 32);
  buffer.writeUInt16LE(bytesPerSample * 8, 34); // BitsPerSample

  // 'data' sub-chunk
  buffer.write('data', 36);
  buffer.writeUInt32LE(dataSize, 40);

  // Write samples with mystical synthesis
  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    let sample = 0;

    const progress = t / durationSec;
    // Envelope (fade in / exponential decay or swell)
    let envelope = 1;

    if (type === 'abertura') {
      // Deep resonant bell + mystery shimmer
      envelope = Math.min(t * 12, 1) * Math.exp(-progress * 2.2);
      const f0 = baseFreq * (1 + (variation % 5) * 0.08);
      sample = 0.5 * Math.sin(2 * Math.PI * f0 * t)
             + 0.3 * Math.sin(2 * Math.PI * (f0 * 1.5) * t)
             + 0.15 * Math.sin(2 * Math.PI * (f0 * 2.01) * t)
             + 0.05 * Math.sin(2 * Math.PI * (f0 * 4.2) * t);
    } else if (type === 'adjetivo') {
      // Whispering harmonic tone
      envelope = Math.sin(progress * Math.PI); // smooth swell
      const f0 = (baseFreq + (variation % 12) * 15);
      const vibrato = Math.sin(2 * Math.PI * 5 * t) * 4;
      sample = 0.4 * Math.sin(2 * Math.PI * (f0 + vibrato) * t)
             + 0.3 * Math.sin(2 * Math.PI * (f0 * 1.33) * t)
             + 0.15 * Math.sin(2 * Math.PI * (f0 * 1.6) * t);
    } else if (type === 'transicao') {
      // Rising suspense tension
      envelope = Math.pow(progress, 1.4); // dramatic swell towards end
      const f0 = baseFreq + Math.pow(progress, 2) * 220;
      sample = 0.45 * Math.sin(2 * Math.PI * f0 * t)
             + 0.25 * Math.sin(2 * Math.PI * (f0 * 1.25) * t)
             + 0.2 * (Math.random() * 2 - 1) * progress; // magic noise hiss
    } else if (type === 'escolha') {
      // Triumphant orchestral chord burst
      envelope = Math.min(t * 20, 1) * Math.exp(-progress * 1.6);
      const f0 = baseFreq * (1 + (variation % 4) * 0.25);
      sample = 0.4 * Math.sin(2 * Math.PI * f0 * t)
             + 0.3 * Math.sin(2 * Math.PI * (f0 * 1.26) * t) // major 3rd
             + 0.3 * Math.sin(2 * Math.PI * (f0 * 1.498) * t) // 5th
             + 0.2 * Math.sin(2 * Math.PI * (f0 * 2) * t); // octave
    }

    const clamped = Math.max(-1, Math.min(1, sample * envelope * 0.7));
    const intSample = Math.floor(clamped * 32767);
    buffer.writeInt16LE(intSample, 44 + i * 2);
  }

  return buffer;
}

console.log('Verificando / gerando arquivos WAV para Chapéu Seletor...');

// 1. Aberturas (1..15)
for (let i = 1; i <= 15; i++) {
  const filePath = path.join(targetDir, `aberturas (${i}).wav`);
  if (!fs.existsSync(filePath)) {
    const wav = createWavBuffer({ durationSec: 2.2, baseFreq: 130, type: 'abertura', variation: i });
    fs.writeFileSync(filePath, wav);
  }
}
console.log('✓ 15 Aberturas verificadas.');

// 2. Adjetivos (1..90)
for (let i = 1; i <= 90; i++) {
  const filePath = path.join(targetDir, `adjetivos (${i}).wav`);
  if (!fs.existsSync(filePath)) {
    const wav = createWavBuffer({ durationSec: 1.6, baseFreq: 260, type: 'adjetivo', variation: i });
    fs.writeFileSync(filePath, wav);
  }
}
console.log('✓ 90 Adjetivos verificados.');

// 3. Transicao (1..15)
for (let i = 1; i <= 15; i++) {
  const filePath = path.join(targetDir, `transicao-casa (${i}).wav`);
  if (!fs.existsSync(filePath)) {
    const wav = createWavBuffer({ durationSec: 2.0, baseFreq: 180, type: 'transicao', variation: i });
    fs.writeFileSync(filePath, wav);
  }
}
console.log('✓ 15 Transições verificadas.');

// 4. Escolha Casa (1..20)
for (let i = 1; i <= 20; i++) {
  const filePath = path.join(targetDir, `escolha-casa (${i}).wav`);
  if (!fs.existsSync(filePath)) {
    const wav = createWavBuffer({ durationSec: 2.8, baseFreq: 196, type: 'escolha', variation: i });
    fs.writeFileSync(filePath, wav);
  }
}
console.log('✓ 20 Escolhas de Casa verificadas.');

console.log('Todos os 140 arquivos de áudio estão prontos e disponíveis em public/assets!');

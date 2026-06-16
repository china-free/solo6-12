import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const AUDIO_DIR = path.resolve(__dirname, '../../data/audio');
const SAMPLE_RATE = 22050;
const MAX_DURATION = 180;

interface WavHeader {
  numChannels: number;
  sampleRate: number;
  bitsPerSample: number;
}

function writeWavHeader(header: WavHeader, dataLength: number): Buffer {
  const buf = Buffer.alloc(44);
  const byteRate = header.sampleRate * header.numChannels * (header.bitsPerSample / 8);
  const blockAlign = header.numChannels * (header.bitsPerSample / 8);
  buf.write('RIFF', 0);
  buf.writeUInt32LE(36 + dataLength, 4);
  buf.write('WAVE', 8);
  buf.write('fmt ', 12);
  buf.writeUInt32LE(16, 16);
  buf.writeUInt16LE(1, 20);
  buf.writeUInt16LE(header.numChannels, 22);
  buf.writeUInt32LE(header.sampleRate, 24);
  buf.writeUInt32LE(byteRate, 28);
  buf.writeUInt16LE(blockAlign, 32);
  buf.writeUInt16LE(header.bitsPerSample, 34);
  buf.write('data', 36);
  buf.writeUInt32LE(dataLength, 40);
  return buf;
}

function generateSpeechLikeAudio(durationSec: number): Int16Array {
  const actualDuration = Math.min(durationSec, MAX_DURATION);
  const numSamples = Math.floor(SAMPLE_RATE * actualDuration);
  const samples = new Int16Array(numSamples);
  const fundamentalFreqs = [180, 200, 220, 160, 240];
  const segmentLength = Math.floor(SAMPLE_RATE * 0.3);

  for (let i = 0; i < numSamples; i++) {
    const t = i / SAMPLE_RATE;
    const segIdx = Math.floor(i / segmentLength);
    const segPos = (i % segmentLength) / segmentLength;
    const freq = fundamentalFreqs[segIdx % fundamentalFreqs.length];

    const envelope = Math.sin(segPos * Math.PI) * (0.6 + 0.3 * Math.sin(t * 0.5));
    const pitchVar = 1 + 0.03 * Math.sin(t * 5.2);
    const f0 = freq * pitchVar;

    let sample = 0;
    sample += 0.5 * Math.sin(2 * Math.PI * f0 * t);
    sample += 0.25 * Math.sin(2 * Math.PI * f0 * 2 * t) * 0.6;
    sample += 0.15 * Math.sin(2 * Math.PI * f0 * 3 * t) * 0.3;
    sample += 0.1 * Math.sin(2 * Math.PI * f0 * 4 * t) * 0.15;
    sample += (Math.random() - 0.5) * 0.08;

    const pauseProb = Math.sin(t * 0.7);
    const pauseFactor = pauseProb > 0.92 ? 0.1 : 1.0;

    const finalVal = sample * envelope * pauseFactor;
    samples[i] = Math.max(-32768, Math.min(32767, Math.floor(finalVal * 20000)));
  }

  return samples;
}

export function ensureMockAudioFiles(taskDurations: Array<{ id: string; audioUrl: string; duration: number }>): void {
  if (!fs.existsSync(AUDIO_DIR)) {
    fs.mkdirSync(AUDIO_DIR, { recursive: true });
  }

  for (const task of taskDurations) {
    const filename = task.audioUrl.replace(/^\/audio\//, '');
    const filePath = path.join(AUDIO_DIR, filename);

    if (fs.existsSync(filePath)) continue;

    const samples = generateSpeechLikeAudio(task.duration);
    const dataLength = samples.length * 2;
    const header = writeWavHeader({
      numChannels: 1,
      sampleRate: SAMPLE_RATE,
      bitsPerSample: 16,
    }, dataLength);

    const buf = Buffer.concat([header, Buffer.from(samples.buffer)]);
    fs.writeFileSync(filePath, buf);
    console.log('[Audio] Generated:', filename, `(${Math.min(task.duration, MAX_DURATION)}s/${task.duration}s, ${(buf.length / 1024).toFixed(1)}KB)`);
  }
}

export { AUDIO_DIR };

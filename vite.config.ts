
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Custom plugin to check for corrupted LFS pointer files masquerading as MP3s
const audioIntegrityCheck = () => {
  return {
    name: 'audio-integrity-check',
    buildStart() {
      const soundDir = path.resolve(__dirname, 'public/sounds');
      if (!fs.existsSync(soundDir)) return;

      const files = fs.readdirSync(soundDir);
      let errors = 0;

      console.log('🔊 Checking audio asset integrity...');

      files.forEach(file => {
        if (file.endsWith('.mp3')) {
          const filePath = path.join(soundDir, file);
          const buffer = fs.readFileSync(filePath);
          
          // Check for Git LFS pointer signature or HTML error signature
          const start = buffer.subarray(0, 50).toString('utf-8');
          
          if (start.includes('version https://git-lfs') || start.includes('<!DOCTYPE html>')) {
            console.error(`\n❌ CRITICAL ASSET ERROR: ${file}`);
            console.error(`   The file appears to be a text pointer, not an MP3.`);
            console.error(`   Size: ${buffer.length} bytes. Content preview: "${start.trim()}"`);
            console.error(`   ACTION REQUIRED: Manually replace this file with the real audio binary.\n`);
            errors++;
          }
        }
      });

      if (errors > 0) {
        throw new Error(`Build failed: ${errors} audio files are corrupted (likely Git LFS pointers). See logs above.`);
      } else {
        console.log('✅ Audio assets look good.');
      }
    }
  }
}

export default defineConfig({
  plugins: [
    react(),
    audioIntegrityCheck()
  ],
  base: './',
});

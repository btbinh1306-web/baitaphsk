import fs from 'node:fs';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

const prunePublicMedia = () => ({
  name: 'prune-public-media',
  apply: 'build' as const,
  closeBundle() {
    const dist = path.resolve(process.cwd(), 'dist');
    for (const directory of ['audio', 'images']) {
      fs.rmSync(path.join(dist, directory), { recursive: true, force: true });
    }
    for (const entry of fs.readdirSync(path.resolve(process.cwd(), 'public'), { withFileTypes: true })) {
      if (entry.isFile() && /^audio_[^/]+\.(?:mp3|wav|ogg|m4a|webm)$/i.test(entry.name)) {
        fs.rmSync(path.join(dist, entry.name), { force: true });
      }
    }
    const publicAssets = path.resolve(process.cwd(), 'public/assets');
    if (fs.existsSync(publicAssets)) {
      const removeCopiedAssets = (directory: string) => {
        for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
          const source = path.join(directory, entry.name);
          const relative = path.relative(publicAssets, source);
          const target = path.join(dist, 'assets', relative);
          if (entry.isDirectory()) removeCopiedAssets(source);
          else fs.rmSync(target, { force: true });
        }
      };
      removeCopiedAssets(publicAssets);
    }
  },
});

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss(), prunePublicMedia()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});

import { defineConfig, type PluginOption } from 'vite';
import react from '@vitejs/plugin-react';
import { visualizer } from 'rollup-plugin-visualizer';

// Optional bundle visualizer when running `npm run analyze`
const plugins: PluginOption[] = [react() as PluginOption];
if (process.env.ANALYZE) {
  plugins.push(visualizer({ filename: 'dist/stats.html', gzipSize: true, brotliSize: true }) as unknown as PluginOption);
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins,
});

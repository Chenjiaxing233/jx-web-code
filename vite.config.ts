import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Material 图标通过 scripts/sync-material-icons.mjs 同步到 public/assets/material-icons，
// 由 Vite 原生静态目录托管，dev 与 build 均可访问。
export default defineConfig({
  plugins: [react()],
});

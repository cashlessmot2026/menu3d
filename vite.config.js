import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Relative paths make the build work both at the domain root and inside
// a GitHub Pages repository URL such as /nombre-del-repositorio/.
export default defineConfig({
  plugins: [react()],
  base: './',
});

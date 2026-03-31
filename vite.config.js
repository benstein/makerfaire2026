import { defineConfig } from 'vite';

export default defineConfig({
  root: '.',
  publicDir: 'public',
  server: {
    open: false,
    watch: {
      ignored: ['**/building.json', '**/changelog.json']
    }
  }
});

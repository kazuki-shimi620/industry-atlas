import {defineConfig} from 'vite';
export default defineConfig({server:{allowedHosts:['terminal.local']},base:process.env.GITHUB_PAGES_BASE||'/',build:{outDir:'dist'}});

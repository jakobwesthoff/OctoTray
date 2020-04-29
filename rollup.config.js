import svelte from 'rollup-plugin-svelte';
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import { terser } from 'rollup-plugin-terser';
import css from 'rollup-plugin-css-porter';
import builtins from 'rollup-plugin-node-builtins';
import globals from 'rollup-plugin-node-globals';
import json from '@rollup/plugin-json';
import svg from 'rollup-plugin-svg';
import amd from 'rollup-plugin-amd';

const production = !process.env.ROLLUP_WATCH;

export default {
  input: 'src/renderer/index.js',
  output: {
    sourcemap: true,
    format: 'cjs',
    name: 'app',
    file: 'public/build/bundle.js',
  },
  plugins: [
    svelte({
      // enable run-time checks when not in production
      dev: !production,
      // we'll extract any component CSS out into
      // a separate file — better for performance
      css: (css) => {
        css.write('public/build/components.css');
      },
    }),

    // If you have external dependencies installed from
    // npm, you'll most likely need these plugins. In
    // some cases you'll need additional configuration —
    // consult the documentation for details:
    // https://github.com/rollup/plugins/tree/master/packages/commonjs
    resolve({
      browser: true,
      dedupe: ['svelte'],
      preferBuiltins: true,
    }),
    commonjs(),
    amd({
      include: 'lib/OctoPrint/**'
    }),
    json(),
    globals(),
    builtins(),
    svg(),
    css({ dest: 'public/build/bundle.css' }),

    // If we're building for production (npm run build
    // instead of npm run dev), minify
    production && terser(),
	],
	external: ['electron', 'child_process', 'fs', 'path', 'url', 'module', 'os'],
  watch: {
    clearScreen: false,
  },
};

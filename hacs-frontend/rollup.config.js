import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import typescript from '@rollup/plugin-typescript';
import terser from '@rollup/plugin-terser';

export default {
  input: 'custom_components/homeguardian_ui/www/src/main.ts',
  output: {
    file: 'custom_components/homeguardian_ui/www/dist/homeguardian-ui.js',
    format: 'iife',
    name: 'HomeGuardianUI',
    sourcemap: true
  },
  plugins: [
    resolve({
      browser: true
    }),
    commonjs(),
    typescript({
      tsconfig: './tsconfig.json',
      declaration: false,
      sourceMap: true
    }),
    terser({
      compress: {
        drop_console: false
      },
      format: {
        comments: false
      }
    })
  ],
  onwarn(warning, warn) {
    // Suppress circular dependency warnings
    if (warning.code === 'CIRCULAR_DEPENDENCY') return;
    warn(warning);
  }
};

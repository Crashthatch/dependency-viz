import resolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';

import postcss from 'rollup-plugin-postcss-export';
//postcss plugins
import simplevars from 'postcss-simple-vars';
import nested from 'postcss-nested';
import cssnext from 'postcss-cssnext';

export default {
  entry: 'main.js',
  dest: 'bundle.js',
  moduleName: 'DependencyViz',
  format: 'iife',
  plugins: [
    postcss({
      plugins: [
        simplevars(),
        nested(),
        cssnext({ warnForDuplicates: false })
      ],
      output: './style.css',
      extensions: ['.scss']
    }),
    resolve({ jsnext: true, module:true, main: true }),
    commonjs()
  ]
};
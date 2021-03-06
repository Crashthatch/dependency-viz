import resolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';
import babel from 'rollup-plugin-babel';
import uglify from 'rollup-plugin-uglify';

import postcss from 'rollup-plugin-postcss-export';
//postcss plugins
import simplevars from 'postcss-simple-vars';
import nested from 'postcss-nested';
import cssnext from 'postcss-cssnext';


export default {
  entry: 'site/src/main.js',
  dest: 'site/dist/bundle.js',
  moduleName: 'DependencyViz',
  format: 'iife',
  plugins: [
    postcss({
      plugins: [
        simplevars(),
        nested(),
        cssnext({ warnForDuplicates: false })
      ],
      output: './site/dist/style.css',
      extensions: ['.scss']
    }),
    babel({
      exclude: 'node_modules/**'
    }),
    resolve({ jsnext: true, module:true, main: true }),
    commonjs(),
    uglify()
  ]
};
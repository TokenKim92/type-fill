const path = require('path');
const webpack = require('webpack');
const pkg = require('./package.json');
const isProduction = process.argv[process.argv.indexOf('--mode') + 1] === 'production'; //prettier-ignore
const FILENAME = pkg.name + (isProduction ? '.min' : '');
const BANNER = [
  'TypeFill',
  '@version ' + pkg.version + ' | ' + new Date().toDateString(),
  '@author ' + pkg.author,
  '@license ' + pkg.license,
].join('\n');

const config = {
  entry: './src/typeFill.js',
  output: {
    path: path.join(__dirname, 'dist'),
    filename: FILENAME + '.js',
    library: ['TypeFill'],
    libraryTarget: 'umd',
    libraryExport: 'default',
  },
  plugins: [
    new webpack.BannerPlugin({
      banner: BANNER,
      entryOnly: true,
    }),
  ],
};

module.exports = config;

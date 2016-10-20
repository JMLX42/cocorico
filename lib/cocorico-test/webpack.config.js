var path = require('path');
var webpack = require('webpack');

module.exports = {
  entry: path.resolve('./src/index.js'),
  target: 'node',
  resolve: {
    extensions: ['.js', '.json'],
    alias: {
      'eth-lightwallet': path.resolve('./node_modules/eth-lightwallet/dist/lightwallet.min.js'),
    },
  },
  module : {
    loaders : [
      {
        test : /\.(js|jsx)$/,
        loader : 'babel',
        exclude: /node_modules/,
        include: [
          path.resolve(__dirname, "src"),
          path.resolve(__dirname, "node_modules/eth-lightwallet"),
        ],
        query: {
          presets : ['es2015'],
          plugins: ['transform-async-to-generator']
        },
      },
      {
        test: /\.json$/,
        loader: 'json-loader',
      },
    ],
  },
  plugins: [
    // https://github.com/visionmedia/superagent/issues/672
    new webpack.DefinePlugin({ "global.GENTLY": false })
  ],
  output: {
    libraryTarget: 'commonjs2',
    path: path.resolve('./lib'),
    filename: 'index.js',
  },
}

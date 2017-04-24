var path = require('path');
var webpack = require('webpack');
var fs = require('fs');

var nodeModules = {};
fs.readdirSync('node_modules')
  .filter(function(x) {
    return ['.bin'].indexOf(x) === -1
  })
  .forEach(function(mod) {
    nodeModules[mod] = 'commonjs ' + mod;
  })

module.exports = {
  entry: path.resolve('./src/index.js'),
  devtool: 'eval',
  target: 'node',
  resolve: {
    extensions: ['.js', '.json'],
  },
  watchOptions: {
    poll: 5000,
    ignored: /node_modules/,
  },
  module : {
    loaders : [
      {
        test : /\.(js|jsx)$/,
        loader : 'babel-loader',
        exclude: /node_modules/,
        include: [
          path.resolve(__dirname, "src"),
        ],
        query: {
          presets : ['es2015'],
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
  externals: nodeModules,
  output: {
    libraryTarget: 'commonjs2',
    path: path.resolve('./lib'),
    filename: 'index.js',
  },
}

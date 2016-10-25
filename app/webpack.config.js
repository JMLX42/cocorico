var path = require('path');
var webpack = require('webpack');
var childProcess = require('child_process');

module.exports = {
  entry: path.resolve('./src/script/index.js'),
  devtool: 'eval',
  resolve: {
    extensions: ['.js', '.jsx', '.less', '.json'],
    alias: {
      'react': path.resolve('./node_modules/react'),
      'eth-lightwallet': path.resolve('./node_modules/eth-lightwallet/dist/lightwallet.min.js'),
    },
  },
  watchOptions: {
    poll: 5000,
    ignored: /node_modules/,
  },
  module : {
    loaders : [
      {
        test : /\.(js|jsx)$/,
        loader : 'babel',
        exclude: /node_modules/,
        query: {
          presets : ['es2015', 'react'],
        },
      },
      {
        test: /\.less$/,
        loader: 'style!css!less',
      },
      {
        test: /\.json$/,
        loader: 'json-loader',
      },
      {
        test: /\.(ttf|eot|svg|woff|woff2)(\?v=[0-9]\.[0-9]\.[0-9]|\?[0-9a-z#]+)?$/,
        loader: 'file-loader',
      },
    ],
  },
  plugins: [
    new webpack.DefinePlugin({
      '__COMMIT_HASH__': JSON.stringify(childProcess.execSync('git rev-parse HEAD').toString()),
      '__ENV__': JSON.stringify('development'),
      '__BUILD_NUMBER__': JSON.stringify(process.env.TRAVIS_BUILD_NUMBER || 'NA'),
      '__BUILD_DATE__': JSON.stringify(new Date().toString()),
    }),
    new webpack.DefinePlugin({
      'process.env': {
        'NODE_ENV': JSON.stringify('development'),
      },
    }),
  ],
  output: {
    path: path.resolve('./public/build'),
    publicPath: '/build/',
    filename: 'app.js',
  },
}

const path = require('path');

module.exports = {
  entry: path.resolve('GitHub-Chrome-Extension/js/popup.js'),
  devtool: 'source-map',
  output: {
    path: path.resolve('GitHub-Chrome-Extension/dist'),
    filename: 'bundle.js'
  },
  module: {
    loaders: [
      {
        test: /\.sass$/,
        loaders: ['style', 'css', 'sass']
      },
      {
        test: /\.js$/,
        exclude: /node_modules/,
        loader: 'babel',
        query: {
          presets: [ 'es2015', 'react' ]
        }
      }
    ]
  }
};

// The source code including full typescript support is available at:
// https://github.com/shakacode/react-on-rails-demo-ssr-hmr/blob/master/config/webpack/commonWebpackConfig.js

// Common configuration applying to client and server configuration
const { generateWebpackConfig, merge } = require('shakapacker');
const path = require('path');

const baseClientWebpackConfig = generateWebpackConfig();
const sharedPath = path.resolve(__dirname, '../../../..', 'shared');

const commonOptions = {
  resolve: {
    extensions: ['.css', '.ts', '.tsx'],
    alias: {
      '@shared': sharedPath,
      '@': path.resolve(__dirname, '../../app/javascript/src'),
    },
  },
  module: {
    rules: [
      {
        test: /\.(ts|tsx)$/,
        include: [sharedPath],
        use: {
          loader: 'babel-loader',
          options: {
            presets: [
              '@babel/preset-typescript',
              ['@babel/preset-react', { runtime: 'automatic' }]
            ]
          }
        }
      }
    ]
  }
};

// Copy the object using merge b/c the baseClientWebpackConfig and commonOptions are mutable globals
const commonWebpackConfig = () => merge({}, baseClientWebpackConfig, commonOptions);

module.exports = commonWebpackConfig;

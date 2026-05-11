// The source code including full typescript support is available at: 
// https://github.com/shakacode/react-on-rails-demo-ssr-hmr/blob/master/config/webpack/serverWebpackConfig.js

const { merge, config } = require('shakapacker');
const commonWebpackConfig = require('./commonWebpackConfig');

const bundler = config.assets_bundler === 'rspack'
  ? require('@rspack/core')
  : require('webpack');
const { RSCWebpackPlugin } = require('react-on-rails-rsc/WebpackPlugin');

function extractLoader(rule, loaderName) {
  if (!Array.isArray(rule.use)) return null;
  return rule.use.find((item) => {
    if (!item) return false;
    const testValue = typeof item === 'string' ? item : (typeof item.loader === 'string' ? item.loader : '');
    return testValue.includes(loaderName);
  });
}

// rscBundle parameter: when true, skips RSCWebpackPlugin (RSC bundle doesn't need it)
const configureServer = (rscBundle = false) => {
  // We need to use "merge" because the clientConfigObject, EVEN after running
  // toWebpackConfig() is a mutable GLOBAL. Thus any changes, like modifying the
  // entry value will result in changing the client config!
  // Using webpack-merge into an empty object avoids this issue.
  const serverWebpackConfig = commonWebpackConfig();

  // We just want the single server bundle entry
  const serverEntry = {
    'server-bundle': serverWebpackConfig.entry['server-bundle'],
  };

  if (!serverEntry['server-bundle']) {
    throw new Error(
      "Create a pack with the file name 'server-bundle.js' containing all the server rendering files",
    );
  }

  serverWebpackConfig.entry = serverEntry;

  // Remove the mini-css-extract-plugin from the style loaders because
  // the client build will handle exporting CSS.
  // replace file-loader with null-loader
  serverWebpackConfig.module.rules.forEach((loader) => {
    if (loader.use && loader.use.filter) {
      loader.use = loader.use.filter((item) => {
        let testValue = '';
        if (typeof item === 'string') {
          testValue = item;
        } else if (item && typeof item.loader === 'string') {
          testValue = item.loader;
        }
        return !(
          testValue.includes('mini-css-extract-plugin') ||
          testValue.includes('cssExtractLoader') // Rspack uses this path
        );
      });
    }
  });

  // No splitting of chunks for a server bundle
  serverWebpackConfig.optimization = {
    minimize: false,
  };
  // Add RSC plugin for server bundle (handles client component references)
  // Skip for RSC bundle - it doesn't need RSCWebpackPlugin
  if (!rscBundle) {
    serverWebpackConfig.plugins.push(new RSCWebpackPlugin({ isServer: true }));
  }
  serverWebpackConfig.plugins.unshift(new bundler.optimize.LimitChunkCountPlugin({ maxChunks: 1 }));

  // Custom output for the server-bundle
  // Using hardcoded path (Shakapacker < 9.0)
  // For Shakapacker 9.0+, consider using config.privateOutputPath instead
  // to automatically sync with shakapacker.yml private_output_path.
  const serverBundleOutputPath = require('path').resolve(__dirname, '../../ssr-generated');

  serverWebpackConfig.output = {
    filename: 'server-bundle.js',
    globalObject: 'this',
    // Required for React on Rails Pro Node Renderer
    libraryTarget: 'commonjs2',
    path: serverBundleOutputPath,
    // No publicPath needed since server bundles are not served via web
    // https://webpack.js.org/configuration/output/#outputglobalobject
  };

  // Validate server bundle output path configuration
  // For Shakapacker < 9.0, verify hardcoded path syncs with Rails config
  // 1. Ensure config/initializers/react_on_rails.rb has: config.server_bundle_output_path = "ssr-generated"
  // 2. Run: rails react_on_rails:doctor to verify configuration
  const fs = require('fs');
  if (!fs.existsSync(serverBundleOutputPath)) {
    console.warn(`⚠️  Server bundle output directory does not exist: ${serverBundleOutputPath}`);
    console.warn('   It will be created during build, but ensure React on Rails is configured:');
    console.warn('   config.server_bundle_output_path = "ssr-generated" in config/initializers/react_on_rails.rb');
    console.warn('   Run: rails react_on_rails:doctor to validate your configuration');
  }


  // Don't hash the server bundle b/c would conflict with the client manifest
  // And no need for the MiniCssExtractPlugin
  serverWebpackConfig.plugins = serverWebpackConfig.plugins.filter(
    (plugin) =>
      plugin.constructor.name !== 'WebpackAssetsManifest' &&
      plugin.constructor.name !== 'MiniCssExtractPlugin' &&
      plugin.constructor.name !== 'ForkTsCheckerWebpackPlugin',
  );

  // Configure loader rules for SSR
  // Remove the mini-css-extract-plugin from the style loaders because
  // the client build will handle exporting CSS.
  // replace file-loader with null-loader
  const rules = serverWebpackConfig.module.rules;
  rules.forEach((rule) => {
    if (Array.isArray(rule.use)) {
      // remove the mini-css-extract-plugin and style-loader
      rule.use = rule.use.filter((item) => {
        let testValue = '';
        if (typeof item === 'string') {
          testValue = item;
        } else if (item && typeof item.loader === 'string') {
          testValue = item.loader;
        }
        return !(
          testValue.includes('mini-css-extract-plugin') ||
          testValue.includes('cssExtractLoader') || // Rspack uses this path
          testValue === 'style-loader'
        );
      });
      const cssLoader = rule.use.find((item) => {
        let testValue = '';

        if (typeof item === 'string') {
          testValue = item;
        } else if (item && typeof item.loader === 'string') {
          testValue = item.loader;
        }

        return testValue.includes('css-loader');
      });
      if (cssLoader && cssLoader.options && cssLoader.options.modules) {
        cssLoader.options.modules = {
          ...(typeof cssLoader.options.modules === 'object' ? cssLoader.options.modules : {}),
          exportOnlyLocals: true,
        };
      }

      // Set SSR caller for Babel (if using Babel instead of SWC)
      const babelLoader = extractLoader(rule, 'babel-loader');
      if (babelLoader && babelLoader.options) {
        babelLoader.options.caller = { ssr: true };
      }

      // Skip writing image files during SSR by setting emitFile to false
    } else if (rule.use && (rule.use.loader === 'url-loader' || rule.use.loader === 'file-loader')) {
      rule.use.options.emitFile = false;
    }
  });

  // Avoid the webpack eval devtool, which triggers a webpack 5.106+ regression
  // with ESM default exports (ReferenceError: __WEBPACK_DEFAULT_EXPORT__ is not defined).
  // In development, cheap-module-source-map provides original line numbers in SSR error traces.
  // In production, devtool is disabled to avoid generating .map files.
  serverWebpackConfig.devtool = process.env.NODE_ENV === 'production' ? false : 'cheap-module-source-map';

  // React on Rails Pro uses Node renderer, so target must be 'node'
  // This fixes issues with libraries like Emotion and loadable-components
  serverWebpackConfig.target = 'node';

  // Disable Node.js polyfills - not needed when targeting Node
  serverWebpackConfig.node = false;

  return serverWebpackConfig;
};

module.exports = {
  default: configureServer,
  extractLoader,
};

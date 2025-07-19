// webpack.config.js
const { createExpoWebpackConfigAsync } = require("@expo/webpack-config");

module.exports = async function (env, argv) {
  const config = await createExpoWebpackConfigAsync(env, argv);

  // Alias react-native-maps to the web implementation
  config.resolve.alias["react-native-maps"] = "@teovilla/react-native-web-maps";

  return config;
};

const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");

const config = getDefaultConfig(__dirname);

// Add custom resolver to handle react-native-maps on web
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (platform === "web" && moduleName === "react-native-maps") {
    return {
      type: "empty",
    };
  }
  if (platform === "web" && moduleName === "react-native-maps-directions") {
    return {
      type: "empty",
    };
  }
  if (
    platform === "web" &&
    moduleName === "react-native-google-places-autocomplete"
  ) {
    return {
      type: "empty",
    };
  }
  // Ensure you call the default resolver
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = withNativeWind(config, { input: "./app/global.css" });

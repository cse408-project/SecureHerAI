module.exports = function (api) {
  api.cache(true);
  
  // Disable nativewind transformation during testing to avoid Jest mock issues
  const isTest = process.env.NODE_ENV === 'test' || process.env.JEST_WORKER_ID;
  
  if (isTest) {
    return {
      presets: [
        ["babel-preset-expo", { jsxImportSource: "react" }],
      ],
    };
  }
  
  return {
    presets: [
      ["babel-preset-expo", { jsxImportSource: "nativewind" }],
      "nativewind/babel",
    ],
  };
};
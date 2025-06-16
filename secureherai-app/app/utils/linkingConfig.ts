/**
 * Extended linking configuration for better handling of deep links
 * including proper parameter parsing
 */
const linkingConfig = {
  prefixes: [
    "secureheraiapp://",
    "secureherai://", // Fallback scheme
    "https://secureherai.app",
    "http://localhost:8081",
  ],
  config: {
    screens: {
      index: "",
      login: "login",
      dashboard: "dashboard",
      "forgot-password": "forgot-password",
      "reset-password": "reset-password",
      "verify-login": "verify-login",
      "test-deep-links": "test-deep-links",
    },
  },
};

export default linkingConfig;

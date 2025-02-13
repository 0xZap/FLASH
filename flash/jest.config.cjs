const baseConfig = require("../jest.config.base.cjs");

module.exports = {
  ...baseConfig,
  coveragePathIgnorePatterns: ["node_modules", "dist", "docs", "index.ts"],
  coverageThreshold: {
    "./src/actions/hyperbolic/*": {
      branches: 0,
      functions: 0,
      statements: 0,
      lines: 0,
    },
    "./src/actions/google/*": {
      branches: 30,
      functions: 30,
      statements: 50,
      lines: 50,
    },
    // "./src/actions/evm/*": {
    //   branches: 30,
    //   functions: 30,
    //   statements: 50,
    //   lines: 50,
    // },
  },
};

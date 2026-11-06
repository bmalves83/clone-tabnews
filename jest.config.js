const dotenv = require("dotenv");
dotenv.config({
  path: ".env.development",
});

const nextJest = require("next/jest");

const createJestConfig = nextJest({
  dir: ".",
});
const jestConfig = createJestConfig({
  moduleDirectories: ["node_modules", "<rootDir>/"],
  testTimeout: 60000,
  transformIgnorePatterns: ["/node_modules/(?!(node-pg-migrate|glob)/)"],
});

module.exports = jestConfig;

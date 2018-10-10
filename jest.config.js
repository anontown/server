const ioMode = process.env["TEST_MODE"] === "IO";

module.exports = {
  transform: {
    "^.+\\.tsx?$": "ts-jest"
  },
  testMatch: [
    "**/src/**/*.spec.ts"
  ],
  testPathIgnorePatterns: [
    "<rootDir>/node_modules/",
    ...(!ioMode ? ["\\.io\\.spec\\.ts"] : [])
  ],
  moduleFileExtensions: [
    "ts",
    "tsx",
    "js",
    "jsx",
    "json",
    "node"
  ],
  collectCoverage: true,
  collectCoverageFrom: [
    "src/**/*.ts"
  ],
  coverageReporters: [
    "html",
    "json"
  ],
  testEnvironment: "node"
};
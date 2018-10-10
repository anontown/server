const ioMode = process.env["TEST_MODE"] === "IO";

module.exports = {
  transform: {
    "^.+\\.tsx?$": "ts-jest"
  },
  testMatch: [
    "**/src/**/*.spec.ts"
  ],
  testPathIgnorePatterns: [
    "/node_modules/",
    ...(!ioMode ? ["**/src/**/*.io.spec.ts"] : [])
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
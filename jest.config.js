module.exports = {
  transform: {
    "^.+\\.tsx?$": "ts-jest"
  },
  testMatch: [
    "**/src/**/*.spec.ts"
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
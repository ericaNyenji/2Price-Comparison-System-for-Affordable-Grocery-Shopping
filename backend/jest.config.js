module.exports = {
  testEnvironment: "node",
  clearMocks: true,
  restoreMocks: true,
  testTimeout: 15000,
  moduleNameMapper: {
    "^buffer-equal-constant-time$":
      "<rootDir>/tests/_mocks/buffer-equal-constant-time.js",
  },
};

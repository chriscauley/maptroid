module.exports = {
  clearMocks: true,
  coverageDirectory: 'coverage',
  testEnvironment: 'jsdom',
  transform: {
    '^.+\\.(js|jsx)$': 'babel-jest',
  },
  "moduleNameMapper": {
    "@/(.*)$": "<rootDir>/src/$1/",
  },
}

module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/backend/__tests__/**/*.test.js'],
  collectCoverageFrom: [
    'backend/routes/**/*.js',
    '!**/node_modules/**',
  ],
  coverageDirectory: 'coverage',
  verbose: true,
  setupFilesAfterEnv: ['./backend/__tests__/setup.js'],
}; 
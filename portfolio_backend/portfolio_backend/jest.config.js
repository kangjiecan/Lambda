export default {
    transform: {
      '^.+\\.js$': 'babel-jest',
    },
    testEnvironment: 'node',
    moduleFileExtensions: ['js', 'json'],
    transformIgnorePatterns: ['/node_modules/'],
    setupFilesAfterEnv: ['./jest.setup.js'], // Ensure the file exists
  };
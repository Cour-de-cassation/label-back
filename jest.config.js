/** @type {import('jest').Config} */
module.exports = {
  preset: 'ts-jest',
  rootDir: 'src',
  moduleFileExtensions: ['js', 'json', 'ts'],
  setupFilesAfterEnv: ["./setupTests.ts"],
  testEnvironment: 'node',
  testMatch: ["**/*.spec.ts"],
  moduleNameMapper: {'^@src/(.*)$': '<rootDir>/$1',
  },
};



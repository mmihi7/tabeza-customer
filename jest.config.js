module.exports = {
  preset: 'ts-jest',
  // jsdom, not node: Supabase and several shared services read `navigator`,
  // `crypto` and `window` at import time. Under the node environment those are
  // missing and whole suites abort with "navigator is not defined".
  testEnvironment: 'jsdom',
  roots: ['<rootDir>'],
  testMatch: ['**/__tests__/**/*.test.ts', '**/__tests__/**/*.test.tsx'],
  setupFiles: ['<rootDir>/jest.setup.js'],
  transform: {
    '^.+\\.(ts|tsx)$': ['ts-jest', {
      tsconfig: {
        jsx: 'react',
        esModuleInterop: true,
      }
    }],
  },
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
    // @tabeza/shared is a `file:./lib/shared` link, so node resolution hands jest
    // the raw .ts source from inside node_modules — which the default
    // transformIgnorePatterns skips, producing "Unexpected token 'export'".
    // Map it back to the in-repo source so ts-jest transforms it like any other.
    '^@tabeza/shared$': '<rootDir>/lib/shared/index.ts',
    '^@tabeza/shared/(.*)$': '<rootDir>/lib/shared/$1',
  },
  testTimeout: 10000,
};

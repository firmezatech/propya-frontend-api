import type { Config } from 'jest';

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'jest-environment-jsdom',
  moduleNameMapper: {
    // Stub lucide-react — it ships as pure ESM and requires a separate transform step.
    // Tests only verify logic and labels; they do not render actual SVG icons.
    'lucide-react': '<rootDir>/src/__tests__/__mocks__/lucide-react-mock.ts',
    '\\.module\\.css$': '<rootDir>/src/__tests__/__mocks__/style-mock.ts',
    '\\.(jpg|jpeg|png|gif|svg|ico)$': '<rootDir>/src/__tests__/__mocks__/file-mock.ts',
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  testMatch: ['<rootDir>/src/__tests__/**/*.test.ts', '<rootDir>/src/__tests__/**/*.test.tsx'],
  transform: {
    '^.+\\.tsx?$': ['ts-jest', {
      tsconfig: { jsx: 'react-jsx' },
    }],
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
};

export default config;

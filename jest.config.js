module.exports = {
  preset: 'react-native',
  setupFiles: ['<rootDir>/jest.setup.js'],
  transformIgnorePatterns: [
    'node_modules/(?!(react-native|@react-native|@react-native-community|@react-navigation|react-native-gesture-handler|react-native-reanimated|react-native-worklets|react-native-svg|heroui-native|uniwind|tailwind-variants|tailwind-merge)/)',
  ],
  moduleNameMapper: {
    '^@env$': '<rootDir>/__mocks__/env.ts',
    '\\.css$': '<rootDir>/__mocks__/styleMock.js',
  },
};

module.exports = {
  presets: ['module:@react-native/babel-preset'],
  // Must be last so worklets are transformed correctly.
  plugins: [
    '@babel/plugin-transform-export-namespace-from',
    [
      'module:react-native-dotenv',
      {
        moduleName: '@env',
        path: '.env',
      },
    ],
    'react-native-worklets/plugin',
  ],
};

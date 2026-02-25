const path = require('path');
const { getDefaultConfig } = require('@react-native/metro-config');
const { withUniwindConfig } = require('uniwind/metro');

const config = getDefaultConfig(__dirname);

const expoStub = path.resolve(__dirname, 'src/stubs/expo-file-system.js');
const originalResolveRequest = config.resolver?.resolveRequest;

config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (
    moduleName === 'expo-file-system' ||
    moduleName.startsWith('expo-modules-core')
  ) {
    return { filePath: expoStub, type: 'sourceFile' };
  }
  if (originalResolveRequest) {
    return originalResolveRequest(context, moduleName, platform);
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = withUniwindConfig(config, {
  cssEntryFile: './src/styles/global.css',
  dtsFile: './uniwind-types.d.ts',
});

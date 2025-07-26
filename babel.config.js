module.exports = {
  presets: ['module:@react-native/babel-preset'],
  plugins: [
    '@babel/plugin-transform-export-namespace-from', // Plugin que adicionamos
    'react-native-reanimated/plugin', // Plugin essencial que precisa estar aqui
  ],
};
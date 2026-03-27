module.exports = function(api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      // Aggiungi QUESTA riga qui sotto:
      'react-native-reanimated/plugin',
    ],
  };
};
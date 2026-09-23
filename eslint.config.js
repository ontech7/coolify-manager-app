// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ['dist/*', '.expo/*'],
  },
  {
    rules: {
      // Our data hooks kick off their fetch from an effect (see hooks/useResources.ts).
      'react-hooks/set-state-in-effect': 'warn',
    },
  },
]);

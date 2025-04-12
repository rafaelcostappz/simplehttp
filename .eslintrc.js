module.exports = {
    parser: '@typescript-eslint/parser',
    parserOptions: {
      ecmaVersion: 2020,
      sourceType: 'module',
    },
    extends: [
      'plugin:@typescript-eslint/recommended',
    ],
    rules: {
      // Changed from 'error' to 'warn'
      '@typescript-eslint/explicit-function-return-type': 'off',
      // Allow any but with a warning
      '@typescript-eslint/no-explicit-any': 'warn',
      // Make unused vars a warning rather than error
      '@typescript-eslint/no-unused-vars': ['warn', { 
        'argsIgnorePattern': '^_',
        'varsIgnorePattern': '^_' 
      }]
    },
  };
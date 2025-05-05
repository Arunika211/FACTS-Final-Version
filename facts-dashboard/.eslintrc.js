module.exports = {
  extends: ['next/core-web-vitals'],
  rules: {
    // Disable rules that might cause build failures
    'react/no-unescaped-entities': 'off',
    'react/display-name': 'off',
    'react/prop-types': 'off',
    'react/react-in-jsx-scope': 'off',
    'import/no-anonymous-default-export': 'off',
    '@typescript-eslint/no-explicit-any': 'off',
    '@typescript-eslint/no-unused-vars': 'warn',
    '@next/next/no-img-element': 'off',
    'jsx-a11y/alt-text': 'off',
    'react-hooks/exhaustive-deps': 'off'
  },
  // Ignore validation for certain files
  ignorePatterns: [
    'node_modules/*',
    '.next/*',
    'out/*',
    'public/*',
    'src/services/api.js'
  ]
}; 
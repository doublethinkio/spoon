module.exports = {
  root: true,
  env: {
    node: true,
    browser: true,
    jest: true,
  },
  extends: [
    'react-app',
    'plugin:jsx-a11y/recommended',
    'plugin:prettier/recommended',
  ],
  plugins: ['jsx-a11y', 'prettier'],
}

module.exports = {
  '*.{js,jsx,ts,tsx}': 'eslint --fix',
  '*': 'prettier --ignore-unknown --write',
  '**/*.{ts,tsx}?(x)': () => 'tsc -p tsconfig.json --noEmit',
}

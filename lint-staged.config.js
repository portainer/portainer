module.exports = {
  '*.(js|ts){,x}': 'eslint --cache --fix',
  '*.(ts){,x}': () => 'tsc --noEmit',
  '*.{js,ts,tsx,css,md,html,json}': 'prettier --write',
  '*.go': 'golangci-lint run -c api/.golangci.yaml',
};

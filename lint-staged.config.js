module.exports = {
  '*.(js|ts){,x}': 'yarn lint',
  '*.(ts){,x}': () => 'tsc --noEmit',
  '*.{js,ts,tsx,css,md,html,json}': 'yarn format',
  '*.go': () => 'make lint-server',
};

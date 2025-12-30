module.exports = {
  '*.(js|ts){,x}': 'pnpm run lint',
  '*.(ts){,x}': () => 'tsc --noEmit',
  '*.{js,ts,tsx,css,md,html,json}': 'pnpm run format',
  '*.go': () => 'make lint-server',
};

module.exports = {
  '*.(js|ts){,x}': 'pnpm eslint --cache --fix',
  '*.(ts){,x}': () => 'tsc --noEmit',
  '*.{js,ts,tsx,css,md,html,json}': 'pnpm prettier --log-level warn --write',
  '*.go': () => ['make lint-server', 'make docs-sync-check'],
};

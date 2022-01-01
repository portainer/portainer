import '../app/assets/css';

import { pushStateLocationPlugin, UIRouter } from '@uirouter/react';

export const parameters = {
  actions: { argTypesRegex: '^on[A-Z].*' },
  controls: {
    matchers: {
      color: /(background|color)$/i,
      date: /Date$/,
    },
  },
};

export const decorators = [
  (Story) => (
    <UIRouter plugins={[pushStateLocationPlugin]}>
      <Story />
    </UIRouter>
  ),
];

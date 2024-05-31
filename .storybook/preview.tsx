import '../app/assets/css';
import React from 'react';
import { pushStateLocationPlugin, UIRouter } from '@uirouter/react';
import { initialize as initMSW, mswLoader } from 'msw-storybook-addon';
import { handlers } from '../app/setup-tests/server-handlers';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

initMSW(
  {
    onUnhandledRequest: ({ method, url }) => {
      if (url.startsWith('/api')) {
        console.error(`Unhandled ${method} request to ${url}.

        This exception has been only logged in the console, however, it's strongly recommended to resolve this error as you don't want unmocked data in Storybook stories.

        If you wish to mock an error response, please refer to this guide: https://mswjs.io/docs/recipes/mocking-error-responses
      `);
      }
    },
  },
  handlers
);

export const parameters = {
  actions: { argTypesRegex: '^on[A-Z].*' },
  controls: {
    matchers: {
      color: /(background|color)$/i,
      date: /Date$/,
    },
  },
  msw: {
    handlers,
  },
};

const testQueryClient = new QueryClient({
  defaultOptions: { queries: { retry: false } },
});

export const decorators = [
  (Story) => (
    <QueryClientProvider client={testQueryClient}>
      <UIRouter plugins={[pushStateLocationPlugin]}>
        <Story />
      </UIRouter>
    </QueryClientProvider>
  ),
];

export const loaders = [mswLoader];

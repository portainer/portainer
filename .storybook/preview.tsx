import { useEffect } from 'react';
import '../app/assets/css';
import { pushStateLocationPlugin, UIRouter } from '@uirouter/react';
import { initialize as initMSW, mswLoader } from 'msw-storybook-addon';
import { handlers } from '../app/setup-tests/server-handlers';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Preview } from '@storybook/react-webpack5';

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

const testQueryClient = new QueryClient({
  defaultOptions: { queries: { retry: false } },
});

const preview: Preview = {
  globalTypes: {
    theme: {
      description: 'Portainer color theme',
      toolbar: {
        title: 'Theme',
        icon: 'paintbrush',
        items: [
          { value: 'light', title: 'Light', icon: 'sun' },
          { value: 'dark', title: 'Dark', icon: 'moon' },
          { value: 'highcontrast', title: 'High Contrast', icon: 'eye' },
        ],
        dynamicTitle: true,
      },
    },
  },
  initialGlobals: {
    theme: 'light',
  },
  decorators: (Story, context) => {
    const theme = context.globals.theme;

    useEffect(() => {
      if (theme === 'light') {
        document.documentElement.removeAttribute('theme');
      } else {
        document.documentElement.setAttribute('theme', theme);
      }
    }, [theme]);

    return (
      <QueryClientProvider client={testQueryClient}>
        <UIRouter plugins={[pushStateLocationPlugin]}>
          <Story />
        </UIRouter>
      </QueryClientProvider>
    );
  },
  loaders: [mswLoader],
  parameters: {
    options: {
      storySort: {
        order: ['Design System', 'Components', '*'],
      },
    },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/,
      },
    },
    msw: {
      handlers,
    },
  },
};

export default preview;

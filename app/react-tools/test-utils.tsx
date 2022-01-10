import '@testing-library/jest-dom';

import { render, RenderOptions } from '@testing-library/react';
import { UIRouter, pushStateLocationPlugin } from '@uirouter/react';
import { PropsWithChildren, ReactElement } from 'react';
import { QueryClient, QueryClientProvider } from 'react-query';

function Provider({ children }: PropsWithChildren<unknown>) {
  return <UIRouter plugins={[pushStateLocationPlugin]}>{children}</UIRouter>;
}

function customRender(ui: ReactElement, options?: RenderOptions) {
  return render(ui, { wrapper: Provider, ...options });
}

// re-export everything
export * from '@testing-library/react';

// override render method
export { customRender as render };

export function renderWithQueryClient(ui: React.ReactElement) {
  const testQueryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const { rerender, ...result } = customRender(
    <QueryClientProvider client={testQueryClient}>{ui}</QueryClientProvider>
  );
  return {
    ...result,
    rerender: (rerenderUi: React.ReactElement) =>
      rerender(
        <QueryClientProvider client={testQueryClient}>
          {rerenderUi}
        </QueryClientProvider>
      ),
  };
}

import '@testing-library/jest-dom';

import { render, RenderOptions } from '@testing-library/react';
import { UIRouter, pushStateLocationPlugin } from '@uirouter/react';
import { PropsWithChildren, ReactElement } from 'react';

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

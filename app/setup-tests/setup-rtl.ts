import { cleanup, configure } from '@testing-library/react';

configure({ testIdAttribute: 'data-cy' });

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

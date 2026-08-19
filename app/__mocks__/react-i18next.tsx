import { PropsWithChildren } from 'react';

import { mockT } from './i18next';

export function useTranslation() {
  return {
    t: mockT,
    i18n: {
      changeLanguage: () => new Promise(() => {}),
    },
  };
}

export function Trans({ children }: PropsWithChildren<unknown>) {
  return <>{children}</>;
}

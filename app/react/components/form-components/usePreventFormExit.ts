import { useEffect } from 'react';
import { useTransitionHook } from '@uirouter/react';

import { confirmGenericDiscard } from '@@/modals/confirm';

export function usePreventFormExit(
  isChanged: () => boolean,
  check = true,
  confirmFn: () => Promise<boolean> = confirmGenericDiscard
) {
  // when navigating away from the page with unsaved changes, show a portainer prompt to confirm
  useTransitionHook('onBefore', {}, async () => {
    // need to calculate inside the hook because it doesn't have dep array
    if (!(check && isChanged())) {
      return true;
    }
    return confirmFn();
  });

  const preventExit = check && isChanged();
  // when reloading or exiting the page with unsaved changes, show a browser prompt to confirm
  useEffect(() => {
    function handler(event: BeforeUnloadEvent) {
      if (!preventExit) {
        return undefined;
      }

      event.preventDefault();
      // eslint-disable-next-line no-param-reassign
      event.returnValue = '';
      return '';
    }

    window.addEventListener('beforeunload', handler);
    return () => {
      window.removeEventListener('beforeunload', handler);
    };
  }, [preventExit]);
}

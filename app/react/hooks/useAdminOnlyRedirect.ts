import { RawParams, useRouter } from '@uirouter/react';
import { useEffect } from 'react';

import { useCurrentUser } from './useUser';

type RedirectOptions = {
  to: string;
  params?: RawParams;
};

/**
 * Redirects to the given route if the user is not a Portainer admin.
 * @param to The route to redirect to (default is `'portainer.home'`).
 * @param params The params to pass to the route.
 */
export function useAdminOnlyRedirect(
  { to, params }: RedirectOptions = { to: 'portainer.home' }
) {
  const router = useRouter();

  const { isPureAdmin } = useCurrentUser();

  useEffect(() => {
    if (!isPureAdmin) {
      router.stateService.go(to, params);
    }
  }, [isPureAdmin, to, params, router.stateService]);
}

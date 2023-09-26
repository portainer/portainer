import { useRouter } from '@uirouter/react';
import { useEffect } from 'react';

import { EnvironmentId } from '../portainer/environments/types';

import { useAuthorizations } from './useUser';

/**
 * Redirects to the given route if the user is not authorized.
 * @param authorizations The authorizations to check.
 * @param redirectTo The route to redirect to.
 * @param redirectParams The params to pass to the route.
 * @param forceEnvironmentId The environment id to use for the check.
 * @param adminOnlyCE Whether to check only for admin authorizations in CE.
 */
export function useUnauthorizedRedirect(
  authorizations: string | string[],
  redirectTo: string,
  redirectParams?: Record<string, unknown>,
  forceEnvironmentId?: EnvironmentId,
  adminOnlyCE = false
) {
  const router = useRouter();

  const isAuthorized = useAuthorizations(
    authorizations,
    forceEnvironmentId,
    adminOnlyCE
  );

  useEffect(() => {
    if (!isAuthorized) {
      router.stateService.go(redirectTo, redirectParams);
    }
  }, [isAuthorized, redirectParams, redirectTo, router.stateService]);
}

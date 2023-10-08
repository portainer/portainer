import { useRouter } from '@uirouter/react';
import { useEffect } from 'react';

import { EnvironmentId } from '../portainer/environments/types';

import { useAuthorizations } from './useUser';

type AuthorizationOptions = {
  authorizations: string | string[];
  forceEnvironmentId?: EnvironmentId;
  adminOnlyCE?: boolean;
};

type RedirectOptions = {
  to: string;
  params: Record<string, unknown>;
};

/**
 * Redirects to the given route if the user is not authorized.
 * @param authorizations The authorizations to check.
 * @param forceEnvironmentId The environment id to use for the check.
 * @param adminOnlyCE Whether to check only for admin authorizations in CE.
 * @param to The route to redirect to.
 * @param params The params to pass to the route.
 */
export function useUnauthorizedRedirect(
  {
    authorizations,
    forceEnvironmentId,
    adminOnlyCE = false,
  }: AuthorizationOptions,
  { to, params }: RedirectOptions
) {
  const router = useRouter();

  const isAuthorized = useAuthorizations(
    authorizations,
    forceEnvironmentId,
    adminOnlyCE
  );

  useEffect(() => {
    if (!isAuthorized) {
      router.stateService.go(to, params);
    }
  }, [isAuthorized, params, to, router.stateService]);
}

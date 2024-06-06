import { useRouter } from '@uirouter/react';
import { useEffect } from 'react';

import { useAuthorizations } from './useUser';

type AuthorizationOptions = {
  authorizations: string | string[];
  adminOnlyCE?: boolean;
};

type RedirectOptions = {
  to: string;
  params?: Record<string, unknown>;
};

/**
 * Redirects to the given route if the user is not authorized.
 * @param authorizations The authorizations to check.
 * @param adminOnlyCE Whether to allow non-admin users in CE.
 * @param to The route to redirect to.
 * @param params The params to pass to the route.
 */
export function useUnauthorizedRedirect(
  { authorizations, adminOnlyCE = false }: AuthorizationOptions,
  { to, params }: RedirectOptions
) {
  const router = useRouter();

  const isAuthorizedQuery = useAuthorizations(
    authorizations,
    undefined,
    adminOnlyCE
  );

  useEffect(() => {
    if (!isAuthorizedQuery.isLoading && !isAuthorizedQuery.authorized) {
      router.stateService.go(to, params);
    }
  }, [isAuthorizedQuery, params, to, router.stateService]);
}

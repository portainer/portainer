import { useCurrentStateAndParams } from '@uirouter/react';
import {
  createContext,
  ReactNode,
  useContext,
  useMemo,
  PropsWithChildren,
} from 'react';

import { isEdgeAdmin, isPureAdmin } from '@/portainer/users/user.helpers';
import { EnvironmentId } from '@/react/portainer/environments/types';
import { User } from '@/portainer/users/types';
import { useLoadCurrentUser } from '@/portainer/users/queries/useLoadCurrentUser';

import { useEnvironment } from '../portainer/environments/queries';
import { isBE } from '../portainer/feature-flags/feature-flags.service';

interface State {
  user?: User;
}

export const UserContext = createContext<State | null>(null);
UserContext.displayName = 'UserContext';

/**
 * @deprecated use `useCurrentUser` instead
 */
export const useUser = useCurrentUser;

export function useCurrentUser() {
  const context = useContext(UserContext);

  if (context === null) {
    throw new Error('should be nested under UserProvider');
  }

  const { user } = context;
  if (typeof user === 'undefined') {
    throw new Error('should be authenticated');
  }

  return useMemo(
    () => ({
      user,
      isPureAdmin: isPureAdmin(user),
    }),
    [user]
  );
}

export function useIsPureAdmin() {
  const { isPureAdmin } = useCurrentUser();
  return isPureAdmin;
}

/**
 * Load the admin status of the user, returning true if the user is edge admin or admin.
 * @param forceEnvironmentId to force the environment id, used where the environment id can't be loaded from the router, like sidebar
 * @returns query result with isLoading and isAdmin - isAdmin is true if the user edge admin or admin.
 */
export function useIsEdgeAdmin({
  forceEnvironmentId,
  noEnvScope,
}: {
  forceEnvironmentId?: EnvironmentId;
  noEnvScope?: boolean;
} = {}) {
  const { user } = useCurrentUser();
  const {
    params: { endpointId },
  } = useCurrentStateAndParams();

  const envId = forceEnvironmentId || endpointId;
  const envScope = typeof noEnvScope === 'boolean' ? !noEnvScope : !!envId;
  const envQuery = useEnvironment(envScope ? envId : undefined);

  if (!envScope) {
    return { isLoading: false, isAdmin: isEdgeAdmin(user) };
  }

  if (envQuery.isLoading) {
    return { isLoading: true, isAdmin: false };
  }

  return {
    isLoading: false,
    isAdmin: isEdgeAdmin(user, envQuery.data),
  };
}

/**
 * Check if the user has some of the authorizations
 *
 * @param authorizations a list of authorizations to check
 * @param forceEnvironmentId to force the environment id, used where the environment id can't be loaded from the router, like sidebar
 * @param adminOnlyCE if true, will return false if the user is not an admin in CE
 * @returns query result with isLoading and authorized - authorized is true if the user has some of the authorizations
 */
export function useAuthorizations(
  authorizations: string | string[],
  forceEnvironmentId?: EnvironmentId,
  adminOnlyCE = false
) {
  const { user } = useCurrentUser();
  const {
    params: { endpointId },
  } = useCurrentStateAndParams();
  const envQuery = useEnvironment(forceEnvironmentId || endpointId);
  const isAdminQuery = useIsEdgeAdmin({ forceEnvironmentId });

  if (!user) {
    return { authorized: false, isLoading: false };
  }

  if (envQuery.isInitialLoading || isAdminQuery.isLoading) {
    return { authorized: false, isLoading: true };
  }

  if (isAdminQuery.isAdmin) {
    return { authorized: true, isLoading: false };
  }

  if (!isBE && adminOnlyCE) {
    return { authorized: false, isLoading: false };
  }

  return {
    authorized: hasAuthorizations(user, authorizations, envQuery.data?.Id),
    isLoading: false,
  };
}

export function useIsEnvironmentAdmin({
  forceEnvironmentId,
  adminOnlyCE = true,
}: {
  forceEnvironmentId?: EnvironmentId;
  adminOnlyCE?: boolean;
} = {}) {
  return useAuthorizations(
    ['EndpointResourcesAccess'],
    forceEnvironmentId,
    adminOnlyCE
  );
}

/**
 * will return true if the user has some of the authorizations. assumes the user is authenticated and not an admin
 *
 * @private Please use `useAuthorizations` instead. Exported only for angular's authentication service app/portainer/services/authentication.js:154
 */
export function hasAuthorizations(
  user: User,
  authorizations: string | string[],
  environmentId?: EnvironmentId
) {
  if (!isBE) {
    return true;
  }

  const authorizationsArray =
    typeof authorizations === 'string' ? [authorizations] : authorizations;

  if (authorizationsArray.length === 0) {
    return true;
  }

  if (!environmentId) {
    return false;
  }

  const userEndpointAuthorizations =
    user.EndpointAuthorizations?.[environmentId] || [];

  return authorizationsArray.some(
    (authorization) => userEndpointAuthorizations[authorization]
  );
}

interface AuthorizedProps {
  authorizations: string | string[];
  environmentId?: EnvironmentId;
  adminOnlyCE?: boolean;
  childrenUnauthorized?: ReactNode;
}

export function Authorized({
  authorizations,
  environmentId,
  adminOnlyCE = false,
  children,
  childrenUnauthorized = null,
}: PropsWithChildren<AuthorizedProps>) {
  const { authorized } = useAuthorizations(
    authorizations,
    environmentId,
    adminOnlyCE
  );

  return authorized ? <>{children}</> : <>{childrenUnauthorized}</>;
}

interface UserProviderProps {
  children: ReactNode;
}

export function UserProvider({ children }: UserProviderProps) {
  const userQuery = useLoadCurrentUser();

  const providerState = useMemo(
    () => ({ user: userQuery.data }),
    [userQuery.data]
  );

  if (!providerState.user) {
    return null;
  }

  return (
    <UserContext.Provider value={providerState}>
      {children}
    </UserContext.Provider>
  );
}

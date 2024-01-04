import { useCurrentStateAndParams } from '@uirouter/react';
import {
  createContext,
  ReactNode,
  useContext,
  useMemo,
  PropsWithChildren,
} from 'react';

import { isAdmin } from '@/portainer/users/user.helpers';
import { EnvironmentId } from '@/react/portainer/environments/types';
import { User } from '@/portainer/users/types';
import { useLoadCurrentUser } from '@/portainer/users/queries/useLoadCurrentUser';

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
      isAdmin: isAdmin(user),
    }),
    [user]
  );
}

export function useAuthorizations(
  authorizations: string | string[],
  forceEnvironmentId?: EnvironmentId,
  adminOnlyCE = false
) {
  const { user } = useUser();
  const {
    params: { endpointId },
  } = useCurrentStateAndParams();

  if (!user) {
    return false;
  }

  return hasAuthorizations(
    user,
    authorizations,
    forceEnvironmentId || endpointId,
    adminOnlyCE
  );
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

export function isEnvironmentAdmin(
  user: User,
  environmentId: EnvironmentId,
  adminOnlyCE = true
) {
  return hasAuthorizations(
    user,
    ['EndpointResourcesAccess'],
    environmentId,
    adminOnlyCE
  );
}

export function hasAuthorizations(
  user: User,
  authorizations: string | string[],
  environmentId?: EnvironmentId,
  adminOnlyCE = false
) {
  const authorizationsArray =
    typeof authorizations === 'string' ? [authorizations] : authorizations;

  if (authorizationsArray.length === 0) {
    return true;
  }

  if (process.env.PORTAINER_EDITION === 'CE') {
    return !adminOnlyCE || isAdmin(user);
  }

  if (!environmentId) {
    return false;
  }

  if (isAdmin(user)) {
    return true;
  }

  if (
    !user.EndpointAuthorizations ||
    !user.EndpointAuthorizations[environmentId]
  ) {
    return false;
  }

  const userEndpointAuthorizations = user.EndpointAuthorizations[environmentId];
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
  const isAllowed = useAuthorizations(
    authorizations,
    environmentId,
    adminOnlyCE
  );

  return isAllowed ? <>{children}</> : <>{childrenUnauthorized}</>;
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

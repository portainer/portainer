import jwtDecode from 'jwt-decode';
import { useCurrentStateAndParams } from '@uirouter/react';
import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
  useMemo,
  PropsWithChildren,
} from 'react';

import { isAdmin } from '@/portainer/users/user.helpers';

import { getUser } from '../users/user.service';
import { User, UserId } from '../users/types';
import { EnvironmentId } from '../environments/types';

import { useLocalStorage } from './useLocalStorage';

interface State {
  user?: User;
}

export const UserContext = createContext<State | null>(null);
UserContext.displayName = 'UserContext';

export function useUser() {
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
}

export function Authorized({
  authorizations,
  environmentId,
  adminOnlyCE = false,
  children,
}: PropsWithChildren<AuthorizedProps>) {
  const isAllowed = useAuthorizations(
    authorizations,
    environmentId,
    adminOnlyCE
  );

  return isAllowed ? <>{children}</> : null;
}

interface UserProviderProps {
  children: ReactNode;
}

export function UserProvider({ children }: UserProviderProps) {
  const [jwt] = useLocalStorage('JWT', '');
  const [user, setUser] = useState<User>();

  useEffect(() => {
    if (jwt !== '') {
      const tokenPayload = jwtDecode(jwt) as { id: number };

      loadUser(tokenPayload.id);
    }
  }, [jwt]);

  const providerState = useMemo(() => ({ user }), [user]);

  if (jwt === '') {
    return null;
  }

  if (!providerState.user) {
    return null;
  }

  return (
    <UserContext.Provider value={providerState}>
      {children}
    </UserContext.Provider>
  );

  async function loadUser(id: UserId) {
    const user = await getUser(id);
    setUser(user);
  }
}

import jwtDecode from 'jwt-decode';
import { useCurrentStateAndParams } from '@uirouter/react';
import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from 'react';

import { getUser } from '@/portainer/services/api/userService';

import { UserViewModel } from '../models/user';

import { useLocalStorage } from './useLocalStorage';

interface State {
  user?: UserViewModel;
}

const state: State = {};

export const UserContext = createContext<State | null>(null);

export function useUser() {
  const context = useContext(UserContext);

  if (context === null) {
    throw new Error('should be nested under UserProvider');
  }

  return context;
}

export function useAuthorizations(authorizations: string | string[]) {
  const authorizationsArray =
    typeof authorizations === 'string' ? [authorizations] : authorizations;

  const { user } = useUser();
  const { params } = useCurrentStateAndParams();

  const { endpointId } = params;
  if (!endpointId) {
    return false;
  }

  if (!user) {
    return false;
  }

  if (isAdmin(user)) {
    return true;
  }

  if (
    !user.EndpointAuthorizations ||
    !user.EndpointAuthorizations[endpointId]
  ) {
    return false;
  }

  const userEndpointAuthorizations = user.EndpointAuthorizations[endpointId];
  return authorizationsArray.some(
    (authorization) => userEndpointAuthorizations[authorization]
  );
}

interface AuthorizedProps {
  authorizations: string | string[];
  children: ReactNode;
}

export function Authorized({ authorizations, children }: AuthorizedProps) {
  const isAllowed = useAuthorizations(authorizations);

  return isAllowed ? <>{children}</> : null;
}

interface UserProviderProps {
  children: ReactNode;
}

export function UserProvider({ children }: UserProviderProps) {
  const [jwt] = useLocalStorage('JWT', '');
  const [user, setUser] = useState<UserViewModel | null>(null);

  useEffect(() => {
    if (state.user) {
      setUser(state.user);
    } else if (jwt !== '') {
      const tokenPayload = jwtDecode(jwt) as { id: number };

      loadUser(tokenPayload.id);
    }
  }, [jwt]);

  if (jwt === '') {
    return null;
  }

  if (user === null) {
    return null;
  }

  return (
    <UserContext.Provider value={{ user }}>{children}</UserContext.Provider>
  );

  async function loadUser(id: number) {
    const user = await getUser(id);
    state.user = user;
    setUser(user);
  }
}

function isAdmin(user: UserViewModel): boolean {
  return user.Role === 1;
}

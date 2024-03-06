import { Transition, TransitionService } from '@uirouter/angularjs';

import { IAuthenticationService } from './services/types';

export enum AccessHeaders {
  Restricted = 'restricted',
  Admin = 'admin',
  EdgeAdmin = 'edge-admin',
}

type Authorizations = string[];
type Access =
  | AccessHeaders.Restricted
  | AccessHeaders.Admin
  | AccessHeaders.EdgeAdmin
  | Authorizations;

export function requiresAuthHook(transitionService: TransitionService) {
  transitionService.onBefore({}, checkAuthorizations);
}

// exported for tests
export async function checkAuthorizations(transition: Transition) {
  const authService: IAuthenticationService = transition
    .injector()
    .get('Authentication');
  const stateTo = transition.to();
  const $state = transition.router.stateService;

  const { access } = stateTo.data || {};
  if (!isAccess(access)) {
    return undefined;
  }

  const isLoggedIn = await authService.init();

  if (!isLoggedIn) {
    // eslint-disable-next-line no-console
    console.info(
      'User is not authenticated, redirecting to login, access:',
      access
    );
    return $state.target('portainer.logout');
  }

  if (typeof access === 'string') {
    if (access === 'restricted') {
      return undefined;
    }

    if (access === 'admin') {
      if (authService.isPureAdmin()) {
        return undefined;
      }

      // eslint-disable-next-line no-console
      console.info(
        'User is not an admin, redirecting to home, access:',
        access
      );
      return $state.target('portainer.home');
    }

    if (access === 'edge-admin') {
      if (authService.isAdmin(true)) {
        return undefined;
      }

      // eslint-disable-next-line no-console
      console.info(
        'User is not an edge admin, redirecting to home, access:',
        access
      );
      return $state.target('portainer.home');
    }
  }

  if (access.length > 0 && !authService.hasAuthorizations(access)) {
    // eslint-disable-next-line no-console
    console.info(
      'User does not have the required authorizations, redirecting to home'
    );
    return $state.target('portainer.home');
  }

  return undefined;
}

function isAccess(access: unknown): access is Access {
  if (!access || (typeof access !== 'string' && !Array.isArray(access))) {
    return false;
  }

  if (Array.isArray(access)) {
    return access.every((a) => typeof a === 'string');
  }

  return ['restricted', 'admin', 'edge-admin'].includes(access);
}

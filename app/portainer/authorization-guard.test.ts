import {
  StateDeclaration,
  StateService,
  Transition,
} from '@uirouter/angularjs';

import { get, keyBuilder } from '@/react/hooks/useLocalStorage';
import { suppressConsoleLogs } from '@/setup-tests/suppress-console';

import { checkAuthorizations } from './authorization-guard';
import { IAuthenticationService } from './services/types';

let restoreConsole: () => void;
beforeEach(() => {
  restoreConsole = suppressConsoleLogs();
});
afterEach(() => {
  restoreConsole();
});

describe('checkAuthorizations', () => {
  let authService = {
    init: vi.fn(),
    isPureAdmin: vi.fn(),
    isAdmin: vi.fn(),
    hasAuthorizations: vi.fn(),
    getUserDetails: vi.fn(),
    isAuthenticated: vi.fn(),
  } satisfies IAuthenticationService;
  let transition: Transition;
  const stateTo: StateDeclaration = {
    data: {
      access: 'restricted',
    },
  };
  const $state = {
    target: vi.fn((t) => t),
  } as unknown as StateService;

  beforeEach(() => {
    authService = {
      init: vi.fn(),
      isPureAdmin: vi.fn(),
      isAdmin: vi.fn(),
      hasAuthorizations: vi.fn(),
      getUserDetails: vi.fn(),
      isAuthenticated: vi.fn(),
    };

    transition = {
      injector: vi.fn().mockReturnValue({
        get: vi.fn().mockReturnValue(authService),
      }),
      to: vi.fn().mockReturnValue(stateTo),
      router: {
        stateService: $state,
      } as Transition['router'],
    } as unknown as Transition;

    stateTo.data.access = 'restricted';
    localStorage.removeItem(keyBuilder('RETURN_URL'));
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should return undefined if access is not defined', async () => {
    stateTo.data.access = undefined;
    const result = await checkAuthorizations(transition);

    expect(result).toBeUndefined();
  });

  it('should return undefined if user is not authenticated and route access is defined', async () => {
    stateTo.data.access = 'something';
    authService.init.mockResolvedValue(false);

    const result = await checkAuthorizations(transition);
    expect(result).toBeUndefined();
  });

  it('should return logout if access is "restricted"', async () => {
    const result = await checkAuthorizations(transition);

    expect(result).toBeDefined();
    expect($state.target).toHaveBeenCalledWith('portainer.logout');
  });

  it('should store the current URL in localStorage when the user is not authenticated', async () => {
    authService.init.mockResolvedValue(false);

    await checkAuthorizations(transition);

    expect(get('RETURN_URL', null)).toBe(
      window.location.pathname + window.location.search + window.location.hash
    );
  });

  it('should not store a returnUrl when the user is authenticated', async () => {
    authService.init.mockResolvedValue(true);

    await checkAuthorizations(transition);

    expect(get('RETURN_URL', null)).toBeNull();
  });

  it('should return undefined if user is an admin and access is "admin"', async () => {
    authService.init.mockResolvedValue(true);
    authService.isPureAdmin.mockReturnValue(true);
    stateTo.data.access = 'admin';

    const result = await checkAuthorizations(transition);

    expect(result).toBeUndefined();
  });

  it('should return undefined if user is an admin and access is "edge-admin"', async () => {
    authService.init.mockResolvedValue(true);
    authService.isAdmin.mockReturnValue(true);
    stateTo.data.access = 'edge-admin';

    const result = await checkAuthorizations(transition);

    expect(result).toBeUndefined();
  });

  it('should return undefined if user has the required authorizations', async () => {
    authService.init.mockResolvedValue(true);
    authService.hasAuthorizations.mockReturnValue(true);
    stateTo.data.access = ['permission1', 'permission2'];

    const result = await checkAuthorizations(transition);

    expect(result).toBeUndefined();
  });

  it('should redirect to home if user does not have the required authorizations', async () => {
    authService.init.mockResolvedValue(true);
    authService.hasAuthorizations.mockReturnValue(false);
    stateTo.data.access = ['permission1', 'permission2'];

    const result = await checkAuthorizations(transition);

    expect(result).toBeDefined();
    expect($state.target).toHaveBeenCalledWith('portainer.home');
  });
});

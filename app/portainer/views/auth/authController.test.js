import { describe, it, expect, vi, beforeEach } from 'vitest';

import { getReturnUrl } from '@/react/portainer/helpers/returnUrl';

import AuthenticationController from './authController.js';

const AUTH_URL = 'http://localhost:9000/#!/auth';

vi.mock('angular', () => {
  const module = { controller: vi.fn() };
  return { default: { module: vi.fn(() => module) }, module: vi.fn(() => module) };
});

vi.mock('@/react/portainer/helpers/returnUrl', () => ({
  getReturnUrl: vi.fn(),
  cleanReturnUrl: vi.fn(),
  storeReturnUrl: vi.fn(),
}));

vi.mock('@/react/portainer/environments/environment.service', () => ({
  getEnvironments: vi.fn(() => Promise.resolve({ value: [{ Id: 1 }] })),
}));

vi.mock('@/portainer/services/http-request.helper', () => ({
  dispatchCacheRefreshEvent: vi.fn(),
}));

function buildController({ userDetails = {}, isAdmin = false, routes = {} } = {}) {
  const $state = { go: vi.fn(), current: { name: 'portainer.auth' } };
  const $window = { location: { href: AUTH_URL } };
  // stands in for ui-router: unknown paths fall to the `otherwise` rule (type RAW)
  const $urlService = {
    match: ({ path }) => (routes[path] ? { rule: { type: 'STATE', state: { name: routes[path] } } } : { rule: { type: 'RAW' } }),
    url: vi.fn(),
    sync: vi.fn(),
  };

  const controller = new AuthenticationController(
    vi.fn(),
    {},
    $state,
    {},
    $window,
    $urlService,
    {
      getUserDetails: () => ({ ID: 7, ...userDetails }),
      isAdmin: () => isAdmin,
    },
    {},
    { initialize: vi.fn(), getState: () => ({ application: { logo: '' } }) },
    { error: vi.fn() },
    {},
    {},
    {},
    {}
  );

  return { controller, $state, $window, $urlService };
}

beforeEach(() => {
  vi.clearAllMocks();
  getReturnUrl.mockReturnValue(null);
});

describe('postLoginSteps', () => {
  it('goes home when there is no returnUrl', async () => {
    const { controller, $state, $window } = buildController();

    await controller.postLoginSteps();

    expect($state.go).toHaveBeenCalledWith('portainer.home');
    expect($window.location.href).toBe(AUTH_URL);
  });

  it('follows a cross-document returnUrl', async () => {
    getReturnUrl.mockReturnValue('/addons/portainer-run/services');
    const { controller, $state, $window } = buildController();

    await controller.postLoginSteps();

    expect($window.location.href).toBe('/addons/portainer-run/services');
    expect($state.go).not.toHaveBeenCalled();
  });

  it('ignores an off-origin returnUrl', async () => {
    getReturnUrl.mockReturnValue('https://evil.example.com/steal');
    const { controller, $state, $window } = buildController();

    await controller.postLoginSteps();

    expect($state.go).toHaveBeenCalledWith('portainer.home');
    expect($window.location.href).toBe(AUTH_URL);
  });

  it('routes a same-document returnUrl through ui-router instead of location.href', async () => {
    getReturnUrl.mockReturnValue('#!/docker/dashboard');
    const { controller, $state, $window, $urlService } = buildController({
      routes: { '/docker/dashboard': 'docker.dashboard' },
    });

    await controller.postLoginSteps();

    expect($urlService.url).toHaveBeenCalledWith('/docker/dashboard');
    expect($urlService.sync).toHaveBeenCalled();
    expect($window.location.href).toBe(AUTH_URL);
    expect($state.go).not.toHaveBeenCalled();
  });

  it('falls back to the normal destination when the returnUrl matches no state', async () => {
    getReturnUrl.mockReturnValue('#!/does-not-exist');
    const { controller, $state, $window, $urlService } = buildController();

    await controller.postLoginSteps();

    expect($state.go).toHaveBeenCalledWith('portainer.home');
    expect($urlService.url).not.toHaveBeenCalled();
    expect($window.location.href).toBe(AUTH_URL);
  });

  it('falls back to the normal destination for a self-referential returnUrl', async () => {
    getReturnUrl.mockReturnValue('#!/auth');
    const { controller, $state, $urlService } = buildController({ routes: { '/auth': 'portainer.auth' } });

    await controller.postLoginSteps();

    expect($state.go).toHaveBeenCalledWith('portainer.home');
    expect($urlService.url).not.toHaveBeenCalled();
  });

  it('does not follow a returnUrl over a forced password change', async () => {
    getReturnUrl.mockReturnValue('/addons/portainer-run/services');
    const { controller, $state, $window } = buildController({ userDetails: { forceChangePassword: true } });

    await controller.postLoginSteps();

    expect($state.go).toHaveBeenCalledWith('portainer.account');
    expect($window.location.href).toBe(AUTH_URL);
  });

  it('does not follow a returnUrl over the wizard when an admin has no environments', async () => {
    const { getEnvironments } = await import('@/react/portainer/environments/environment.service');
    getEnvironments.mockResolvedValueOnce({ value: [] });
    getReturnUrl.mockReturnValue('/addons/portainer-run/services');
    const { controller, $state, $window } = buildController({ isAdmin: true });

    await controller.postLoginSteps();

    expect($state.go).toHaveBeenCalledWith('portainer.wizard');
    expect($window.location.href).toBe(AUTH_URL);
  });
});

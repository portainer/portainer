import { describe, expect, test, vi } from 'vitest';

vi.mock('angular', () => ({
  default: {
    module: () => ({
      controller: vi.fn(),
    }),
  },
}));

vi.mock('@/portainer/services/http-request.helper', () => ({
  dispatchCacheRefreshEvent: vi.fn(),
}));

vi.mock('@/react/portainer/helpers/returnUrl', () => ({
  cleanReturnUrl: vi.fn(),
}));

import LogoutController from './logoutController';

function buildController({ userId, isOAuthLogin, oauthLogoutURI }) {
  // Mirrors the real Authentication service: logout() clears the user
  // data (cleanUserData() sets user = {}), so getUserDetails() returns
  // an empty object after logout.
  const user = { ID: userId };
  const Authentication = {
    getUserDetails: () => user,
    isOAuthLogin: () => isOAuthLogin,
    logout: vi.fn(async () => {
      delete user.ID;
    }),
  };

  const $state = { go: vi.fn() };
  const $window = { location: { href: '' } };
  const SettingsService = {
    publicSettings: vi.fn(async () => ({ OAuthLogoutURI: oauthLogoutURI })),
  };

  const controller = new LogoutController(
    (fn) => fn(),
    $state,
    { params: () => ({}) },
    $window,
    Authentication,
    { getState: () => ({ application: { logo: '' } }) },
    { error: vi.fn() },
    { storeLogoutReason: vi.fn() },
    SettingsService
  );

  return { controller, $state, $window, Authentication };
}

describe('LogoutController', () => {
  test('internal user is sent back to the login page, not the OAuth logout URL', async () => {
    const { controller, $state, $window } = buildController({
      userId: 2,
      isOAuthLogin: false,
      oauthLogoutURI: 'https://idp.example.com/logout',
    });

    await controller.logoutAsync();

    expect($window.location.href).toBe('');
    expect($state.go).toHaveBeenCalledWith('portainer.auth', { reload: true });
  });

  test('initial admin (ID 1) is sent back to the login page even for an OAuth session', async () => {
    const { controller, $state, $window } = buildController({
      userId: 1,
      isOAuthLogin: true,
      oauthLogoutURI: 'https://idp.example.com/logout',
    });

    await controller.logoutAsync();

    expect($window.location.href).toBe('');
    expect($state.go).toHaveBeenCalledWith('portainer.auth', { reload: true });
  });

  test('OAuth user is redirected to the OAuth logout URL', async () => {
    const { controller, $state, $window } = buildController({
      userId: 2,
      isOAuthLogin: true,
      oauthLogoutURI: 'https://idp.example.com/logout',
    });

    await controller.logoutAsync();

    expect($window.location.href).toBe('https://idp.example.com/logout');
    expect($state.go).not.toHaveBeenCalled();
  });

  test('no OAuth logout URL configured sends the user back to the login page', async () => {
    const { controller, $state, $window } = buildController({
      userId: 2,
      isOAuthLogin: true,
      oauthLogoutURI: '',
    });

    await controller.logoutAsync();

    expect($window.location.href).toBe('');
    expect($state.go).toHaveBeenCalledWith('portainer.auth', { reload: true });
  });
});

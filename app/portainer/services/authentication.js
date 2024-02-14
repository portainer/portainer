import { getCurrentUser } from '../users/queries/useLoadCurrentUser';
import * as userHelpers from '../users/user.helpers';
import { clear as clearSessionStorage } from './session-storage';

const DEFAULT_USER = 'admin';
const DEFAULT_PASSWORD = 'K7yJPP5qNK4hf1QsRnfV';

angular.module('portainer.app').factory('Authentication', [
  '$async',
  'Auth',
  'OAuth',
  'LocalStorage',
  'StateManager',
  'EndpointProvider',
  'ThemeManager',
  function AuthenticationFactory($async, Auth, OAuth, LocalStorage, StateManager, EndpointProvider, ThemeManager) {
    'use strict';

    var service = {};
    var user = {};

    service.init = init;
    service.OAuthLogin = OAuthLogin;
    service.login = login;
    service.logout = logout;
    service.isAuthenticated = isAuthenticated;
    service.getUserDetails = getUserDetails;
    service.isAdmin = isAdmin;
    service.isEdgeAdmin = isEdgeAdmin;
    service.isPureAdmin = isPureAdmin;
    service.hasAuthorizations = hasAuthorizations;

    async function initAsync() {
      try {
        const userId = LocalStorage.getUserId();
        if (userId && user.ID === userId) {
          return true;
        }
        await tryAutoLoginExtension();
        await loadUserData();
        return true;
      } catch (error) {
        return tryAutoLoginExtension();
      }
    }

    async function logoutAsync() {
      if (isAuthenticated()) {
        await Auth.logout().$promise;
      }

      clearSessionStorage();
      StateManager.clean();
      EndpointProvider.clean();
      LocalStorage.cleanAuthData();
      LocalStorage.storeLoginStateUUID('');
      tryAutoLoginExtension();
      cleanUserData();
    }

    function logout() {
      return $async(logoutAsync);
    }

    function init() {
      return $async(initAsync);
    }

    async function OAuthLoginAsync(code) {
      await OAuth.validate({ code: code }).$promise;
      await loadUserData();
    }

    function OAuthLogin(code) {
      return $async(OAuthLoginAsync, code);
    }

    async function loginAsync(username, password) {
      await Auth.login({ username: username, password: password }).$promise;
      await loadUserData();
    }

    function login(username, password) {
      return $async(loginAsync, username, password);
    }

    function isAuthenticated() {
      return !!user.ID;
    }

    function getUserDetails() {
      return user;
    }

    function cleanUserData() {
      user = {};
    }

    async function loadUserData() {
      const userData = await getCurrentUser();
      user.username = userData.Username;
      user.ID = userData.Id;
      user.role = userData.Role;
      user.forceChangePassword = userData.forceChangePassword;
      user.endpointAuthorizations = userData.EndpointAuthorizations;
      user.portainerAuthorizations = userData.PortainerAuthorizations;

      // Initialize user theme base on UserTheme from database
      const userTheme = userData.ThemeSettings ? userData.ThemeSettings.color : 'auto';
      if (userTheme === 'auto' || !userTheme) {
        ThemeManager.autoTheme();
      } else {
        ThemeManager.setTheme(userTheme);
      }

      LocalStorage.storeUserId(userData.Id);
    }

    function tryAutoLoginExtension() {
      if (!window.ddExtension) {
        return false;
      }

      return login(DEFAULT_USER, DEFAULT_PASSWORD);
    }

    // To avoid creating divergence between CE and EE
    // isAdmin checks if the user is a portainer admin or edge admin
    function isEdgeAdmin() {
      const environment = EndpointProvider.currentEndpoint();
      return userHelpers.isEdgeAdmin({ Role: user.role }, environment);
    }

    /**
     * @deprecated use Authentication.isAdmin instead
     */
    function isAdmin() {
      return isEdgeAdmin();
    }

    // To avoid creating divergence between CE and EE
    // isPureAdmin checks if the user is portainer admin only
    function isPureAdmin() {
      return userHelpers.isPureAdmin({ Role: user.role });
    }

    function hasAuthorizations(authorizations) {
      const endpointId = EndpointProvider.endpointID();
      if (isAdmin()) {
        return true;
      }
      if (!user.endpointAuthorizations || !user.endpointAuthorizations[endpointId]) {
        return false;
      }
      const userEndpointAuthorizations = user.endpointAuthorizations[endpointId];
      return authorizations.some((authorization) => userEndpointAuthorizations[authorization]);
    }

    if (process.env.NODE_ENV === 'development') {
      window.login = loginAsync;
    }

    return service;
  },
]);

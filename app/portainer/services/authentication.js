import { clear as clearSessionStorage } from './session-storage';

angular.module('portainer.app').factory('Authentication', [
  '$async',
  '$state',
  'Auth',
  'OAuth',
  'jwtHelper',
  'LocalStorage',
  'StateManager',
  'EndpointProvider',
  'UserService',
  'ThemeManager',
  function AuthenticationFactory($async, $state, Auth, OAuth, jwtHelper, LocalStorage, StateManager, EndpointProvider, UserService, ThemeManager) {
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

    async function initAsync() {
      try {
        const jwt = LocalStorage.getJWT();
        if (!jwt || jwtHelper.isTokenExpired(jwt)) {
          return tryAutoLoginExtension();
        }
        await setUser(jwt);
        return true;
      } catch (error) {
        console.log('Unable to initialize authentication service', error);
        return tryAutoLoginExtension();
      }
    }

    async function logoutAsync(performApiLogout) {
      if (performApiLogout) {
        await Auth.logout().$promise;
      }

      clearSessionStorage();
      StateManager.clean();
      EndpointProvider.clean();
      LocalStorage.cleanAuthData();
      LocalStorage.storeLoginStateUUID('');
      tryAutoLoginExtension();
    }

    function logout(performApiLogout) {
      return $async(logoutAsync, performApiLogout);
    }

    function init() {
      return $async(initAsync);
    }

    async function OAuthLoginAsync(code) {
      const response = await OAuth.validate({ code: code }).$promise;
      const jwt = setJWTFromResponse(response);
      await setUser(jwt);
    }

    function setJWTFromResponse(response) {
      const jwt = response.jwt;
      LocalStorage.storeJWT(jwt);

      return response.jwt;
    }

    function OAuthLogin(code) {
      return $async(OAuthLoginAsync, code);
    }

    async function loginAsync(username, password) {
      const response = await Auth.login({ username: username, password: password }).$promise;
      const jwt = setJWTFromResponse(response);
      await setUser(jwt);
    }

    function login(username, password) {
      return $async(loginAsync, username, password);
    }

    function isAuthenticated() {
      var jwt = LocalStorage.getJWT();
      return !!jwt && !jwtHelper.isTokenExpired(jwt);
    }

    function getUserDetails() {
      return user;
    }

    async function setUserTheme() {
      const data = await UserService.user(user.ID);
      // Initialize user theme base on Usertheme from database
      const userTheme = data.UserTheme;
      if (userTheme === 'auto' || !userTheme) {
        ThemeManager.autoTheme();
      } else {
        ThemeManager.setTheme(userTheme);
      }
    }

    async function setUser(jwt) {
      var tokenPayload = jwtHelper.decodeToken(jwt);
      user.username = tokenPayload.username;
      user.ID = tokenPayload.id;
      user.role = tokenPayload.role;
      await setUserTheme();
    }

    function tryAutoLoginExtension() {
      if (!window.ddExtension) {
        return false;
      }
      console.debug('Auto-login Docker Desktop');
      return login('admin', 'Passw0rd;');
    }

    function isAdmin() {
      return !!user && user.role === 1;
    }

    return service;
  },
]);

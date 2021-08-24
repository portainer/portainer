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
        if (jwt) {
          await setUser(jwt);
        }
        return !!jwt;
      } catch (error) {
        return false;
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
    }

    function logout(performApiLogout) {
      return $async(logoutAsync, performApiLogout);
    }

    function init() {
      return $async(initAsync);
    }

    async function OAuthLoginAsync(code) {
      const response = await OAuth.validate({ code: code }).$promise;
      await setUser(response.jwt);
    }

    function OAuthLogin(code) {
      return $async(OAuthLoginAsync, code);
    }

    async function loginAsync(username, password) {
      const response = await Auth.login({ username: username, password: password }).$promise;
      await setUser(response.jwt);
    }

    function login(username, password) {
      return $async(loginAsync, username, password);
    }

    function isAuthenticated() {
      var jwt = LocalStorage.getJWT();
      return jwt && !jwtHelper.isTokenExpired(jwt);
    }

    function getUserDetails() {
      return user;
    }

    async function setUserTheme() {
      const data = await UserService.user(user.ID);
      // Initialize user theme base on Usertheme from database
      const userTheme = data.UserTheme;
      ThemeManager.setTheme(userTheme);
    }

    async function setUser(jwt) {
      LocalStorage.storeJWT(jwt);
      var tokenPayload = jwtHelper.decodeToken(jwt);
      user.username = tokenPayload.username;
      user.ID = tokenPayload.id;
      user.role = tokenPayload.role;
      await setUserTheme();
    }

    function isAdmin() {
      if (user.role === 1) {
        return true;
      }
      return false;
    }

    return service;
  },
]);

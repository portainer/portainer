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
  function AuthenticationFactory($async, $state, Auth, OAuth, jwtHelper, LocalStorage, StateManager, EndpointProvider, UserService) {
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
    service.hasAuthorizations = hasAuthorizations;
    service.redirectIfUnauthorized = redirectIfUnauthorized;

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

    async function retrievePermissions() {
      const data = await UserService.user(user.ID);
      user.endpointAuthorizations = data.EndpointAuthorizations;
      user.portainerAuthorizations = data.PortainerAuthorizations;
    }

    async function setUser(jwt) {
      LocalStorage.storeJWT(jwt);
      var tokenPayload = jwtHelper.decodeToken(jwt);
      user.username = tokenPayload.username;
      user.ID = tokenPayload.id;
      user.role = tokenPayload.role;
      await retrievePermissions();
    }

    function isAdmin() {
      if (user.role === 1) {
        return true;
      }
      return false;
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

    function redirectIfUnauthorized(authorizations) {
      const authorized = hasAuthorizations(authorizations);
      if (!authorized) {
        $state.go('portainer.home');
      }
    }

    return service;
  },
]);

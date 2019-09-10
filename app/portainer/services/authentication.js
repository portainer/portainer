angular.module('portainer.app')
.factory('Authentication', [
'Auth', 'OAuth', 'jwtHelper', 'LocalStorage', 'StateManager', 'EndpointProvider', 'UserService',
function AuthenticationFactory(Auth, OAuth, jwtHelper, LocalStorage, StateManager, EndpointProvider, UserService) {
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
  service.retrievePermissions = retrievePermissions;

  function init() {
    var jwt = LocalStorage.getJWT();

    if (jwt) {
      setUser(jwt);
    }
  }

  function OAuthLogin(code) {
    return OAuth.validate({ code: code }).$promise
      .then(function onLoginSuccess(response) {
        return setUser(response.jwt);
      });
  }

  function login(username, password) {
    return Auth.login({ username: username, password: password }).$promise
      .then(function onLoginSuccess(response) {
        return setUser(response.jwt);
      });
  }

  function logout() {
    StateManager.clean();
    EndpointProvider.clean();
    LocalStorage.clean();
  }

  function isAuthenticated() {
    var jwt = LocalStorage.getJWT();
    return jwt && !jwtHelper.isTokenExpired(jwt);
  }

  function getUserDetails() {
    return user;
  }

  function retrievePermissions() {
    return UserService.user(user.ID)
    .then((data) => {
      user.endpointAuthorizations = data.EndpointAuthorizations;
      user.portainerAuthorizations = data.PortainerAuthorizations;
    });
  }

  function setUser(jwt) {
    LocalStorage.storeJWT(jwt);
    var tokenPayload = jwtHelper.decodeToken(jwt);
    user.username = tokenPayload.username;
    user.ID = tokenPayload.id;
    user.role = tokenPayload.role;
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
    if (!user.endpointAuthorizations || (user.endpointAuthorizations && !user.endpointAuthorizations[endpointId])) {
      return false;
    }
    for (var i = 0; i < authorizations.length; i++) {
      var authorization = authorizations[i];
      if (user.endpointAuthorizations[endpointId][authorization]) {
        return true;
      }
    }
    return false;
  }

  return service;
}]);

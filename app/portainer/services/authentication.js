angular.module('portainer.app')
.factory('Authentication', [
'Auth', 'OAuthService', 'jwtHelper', 'LocalStorage', 'StateManager', 'EndpointProvider', 
function AuthenticationFactory(Auth, OAuthService, jwtHelper, LocalStorage, StateManager, EndpointProvider) {
  'use strict';

  var service = {};
  var user = {};

  service.init = init;
  service.OAuthLogin = OAuthLogin;
  service.login = login;
  service.logout = logout;
  service.isAuthenticated = isAuthenticated;
  service.getUserDetails = getUserDetails;
  
  

  function init() {
    var jwt = LocalStorage.getJWT();

    if (jwt) {
      setUser(jwt);
    }
  }

  function OAuthLogin() {
    return OAuthService.login()
      .then(function onLoginSuccess(loginResponse) {
        setUser(loginResponse.jwt);
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

  function setUser(jwt) {
    LocalStorage.storeJWT(jwt);
    var tokenPayload = jwtHelper.decodeToken(jwt);
    user.username = tokenPayload.username;
    user.ID = tokenPayload.id;
    user.role = tokenPayload.role;
  }

  return service;
}]);

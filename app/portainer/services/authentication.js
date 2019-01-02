angular.module('portainer.app')
.factory('Authentication', [
'Auth', 'OAuth', 'jwtHelper', 'LocalStorage', 'StateManager', 'EndpointProvider', 
function AuthenticationFactory(Auth, OAuth, jwtHelper, LocalStorage, StateManager, EndpointProvider) {
  'use strict';

  var service = {};
  var user = {};

  service.init = init;
  service.oAuthLogin = oAuthLogin;
  service.login = login;
  service.logout = logout;
  service.isAuthenticated = isAuthenticated;
  service.getUserDetails = getUserDetails;

  function init() {
    var jwt = LocalStorage.getJWT();

    if (jwt) {
      var tokenPayload = jwtHelper.decodeToken(jwt);
      user.username = tokenPayload.username;
      user.ID = tokenPayload.id;
      user.role = tokenPayload.role;
    }
  }

  function oAuthLogin(code) {
    return OAuth.login({code: code}).$promise
    .then(function success(data) {
      LocalStorage.storeJWT(data.jwt);
      var tokenPayload = jwtHelper.decodeToken(data.jwt);
      user.username = tokenPayload.username;
      user.ID = tokenPayload.id;
      user.role = tokenPayload.role;
    });
  }

  function login(username, password) {
    return Auth.login({username: username, password: password}).$promise
    .then(function success(data) {
      LocalStorage.storeJWT(data.jwt);
      var tokenPayload = jwtHelper.decodeToken(data.jwt);
      user.username = username;
      user.ID = tokenPayload.id;
      user.role = tokenPayload.role;
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

  return service;
}]);

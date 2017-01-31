angular.module('portainer.services')
.factory('Authentication', ['$q', '$rootScope', 'Auth', 'jwtHelper', 'LocalStorage', 'StateManager', function AuthenticationFactory($q, $rootScope, Auth, jwtHelper, LocalStorage, StateManager) {
  'use strict';
  return {
    init: function() {
      var jwt = LocalStorage.getJWT();
      if (jwt) {
        var tokenPayload = jwtHelper.decodeToken(jwt);
        $rootScope.username = tokenPayload.username;
      }
    },
    login: function(username, password) {
      return $q(function (resolve, reject) {
        Auth.login({username: username, password: password}).$promise
        .then(function(data) {
          LocalStorage.storeJWT(data.jwt);
          $rootScope.username = username;
          resolve();
        }, function() {
          reject();
        });
      });
    },
    logout: function() {
      StateManager.clean();
      LocalStorage.clean();
    },
    isAuthenticated: function() {
      var jwt = LocalStorage.getJWT();
      return jwt && !jwtHelper.isTokenExpired(jwt);
    }
  };
}]);

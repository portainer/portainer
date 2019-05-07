angular.module('portainer.app')
.factory('UserHelper', [function UserHelperFactory() {
  'use strict';
  var helper = {};

  helper.filterNonAdministratorUsers = function(users) {
    return users.filter(function (user) {
      if (user.Role !== 1 && user.RoleId !== 1) {
        return user;
      }
    });
  };

  return helper;
}]);

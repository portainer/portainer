angular.module('portainer.services')
.factory('UserService', ['$q', 'Users', 'UserHelper', function UserServiceFactory($q, Users, UserHelper) {
  'use strict';
  var service = {};

  service.users = function(includeAdministrators) {
    var deferred = $q.defer();
    Users.query({}).$promise
    .then(function success(data) {
      var users = data.map(function (user) {
        return new UserViewModel(user);
      });
      if (!includeAdministrators) {
        users = UserHelper.filterNonAdministratorUsers(users);
      }
      deferred.resolve(users);
    })
    .catch(function error(err) {
      deferred.reject({ msg: 'Unable to retrieve users', err: err });
    });
    return deferred.promise;
  };

  service.user = function(id) {
    return Users.get({id: id}).$promise;
  };

  service.createUser = function(username, password, role) {
    return Users.create({}, {username: username, password: password, role: role}).$promise;
  };

  service.deleteUser = function(id) {
    return Users.remove({id: id}).$promise;
  };

  service.updateUser = function(id, password, role) {
    var query = {
      password: password,
      role: role
    };
    return Users.update({id: id}, query).$promise;
  };

  service.updateUserPassword = function(id, currentPassword, newPassword) {
    var deferred = $q.defer();
    Users.checkPassword({id: id}, {password: currentPassword}).$promise
    .then(function success(data) {
      if (!data.valid) {
        deferred.reject({invalidPassword: true});
      }
      return service.updateUser(id, newPassword, undefined);
    })
    .then(function success(data) {
      deferred.resolve();
    })
    .catch(function error(err) {
      deferred.reject({msg: 'Unable to update user password', err: err});
    });
    return deferred.promise;
  };

  return service;
}]);

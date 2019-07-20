import {
  RoleViewModel,
  // EndpointRoleCreateRequest,
  // EndpointRoleUpdateRequest
} from '../models/role';

angular.module('portainer.extensions.rbac')
.factory('RoleService', ['$q', 'Roles',
function RoleService($q, Roles) {
  'use strict';
  var service = {};

  service.role = function(roleId) {
    var deferred = $q.defer();

    Roles.get({ id: roleId }).$promise
    .then(function success(data) {
      var role = new RoleViewModel(data);
      deferred.resolve(role);
    })
    .catch(function error(err) {
      deferred.reject({ msg: 'Unable to retrieve role', err: err });
    });

    return deferred.promise;
  };

  service.roles = function() {
    return Roles.query({}).$promise;
  };

  // service.createRole = function(model, endpoints) {
  //   var payload = new EndpointRoleCreateRequest(model, endpoints);
  //   return EndpointRoles.create(payload).$promise;
  // };
  //
  // service.updateRole = function(model, endpoints) {
  //   var payload = new EndpointRoleUpdateRequest(model, endpoints);
  //   return EndpointRoles.update(payload).$promise;
  // };

  service.deleteRole = function(roleId) {
    return Roles.remove({ id: roleId }).$promise;
  };

  return service;
}]);

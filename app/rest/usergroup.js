angular.module('portainer.rest')
.factory('UserGroups', ['$resource', 'USERGROUPS_ENDPOINT', function UserGroupsFactory($resource, USERGROUPS_ENDPOINT) {
  'use strict';
  return $resource(USERGROUPS_ENDPOINT + '/:id/:action', {}, {
    query: { method: 'GET', isArray: true },
  });
}]);

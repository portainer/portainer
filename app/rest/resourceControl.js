angular.module('portainer.rest')
.factory('ResourceControl', ['$resource', 'USERS_ENDPOINT', function ResourceControlFactory($resource, USERS_ENDPOINT) {
  'use strict';
  return $resource(USERS_ENDPOINT + '/:userId/resources/:resourceType/:resourceId', {}, {
    create: { method: 'POST', params: { userId: '@userId', resourceType: '@resourceType' } },
    remove: { method: 'DELETE', params: { userId: '@userId', resourceId: '@resourceId', resourceType: '@resourceType' } },
  });
}]);

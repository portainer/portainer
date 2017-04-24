angular.module('portainer.rest')
.factory('ResourceControl', ['$resource', 'USERS_ENDPOINT', function ResourceControlFactory($resource, USERS_ENDPOINT) {
  'use strict';
  return $resource(USERS_ENDPOINT + '/:userId/resources/:resourceType/:resourceId', {}, {
    create: { method: 'POST', params: { userId: '@userId', resourceType: '@resourceType' } },
    remove: { method: 'DELETE', params: { userId: '@userId', resourceId: '@resourceId', resourceType: '@resourceType' } },
  });
}]);
angular.module('portainer.rest')
.factory('RC', ['$resource', 'RESOURCE_ENDPOINT', function RCFactory($resource, RESOURCE_ENDPOINT) {
  'use strict';
  return $resource(RESOURCE_ENDPOINT + '/:id', {}, {
    create: { method: 'POST' },
    get: { method: 'GET', params: { id: '@id' } },
    update: { method: 'PUT', params: { id: '@id' } },
    remove: { method: 'DELETE', params: { id: '@id'} },
  });
}]);

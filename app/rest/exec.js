angular.module('portainer.rest')
.factory('Exec', ['$resource', 'Settings', function ExecFactory($resource, Settings) {
  'use strict';
  return $resource(Settings.url + '/exec/:id/:action', {}, {
    resize: {
      method: 'POST', params: {id: '@id', action: 'resize', h: '@height', w: '@width'},
      transformResponse: genericHandler
    }
  });
}]);

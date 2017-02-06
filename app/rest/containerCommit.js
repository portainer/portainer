angular.module('portainer.rest')
.factory('ContainerCommit', ['$resource', 'Settings', function ContainerCommitFactory($resource, Settings) {
  'use strict';
  return $resource(Settings.url + '/commit', {}, {
    commit: {method: 'POST', params: {container: '@id', repo: '@repo', tag: '@tag'}}
  });
}]);

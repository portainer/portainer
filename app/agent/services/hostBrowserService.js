angular.module('portainer.agent').factory('HostBrowserService', [
  'Browse',
  function HostBrowserServiceFactory(Browse) {
    var service = {};

    service.ls = ls;
    service.get = get;
    service.delete = deletePath;
    service.rename = rename;

    function ls(path) {
      return Browse.ls({ path: path }).$promise;
    }

    function get(path) {
      return Browse.get({ path: path }).$promise;
    }

    function deletePath(path) {
      return Browse.delete({ path: path }).$promise;
    }

    function rename(path, newPath) {
      var payload = {
        CurrentFilePath: path,
        NewFilePath: newPath
      };
      return Browse.rename({}, payload).$promise;
    }

    return service;
  }
]);

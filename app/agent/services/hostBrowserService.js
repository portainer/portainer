angular.module('portainer.agent').factory('HostBrowserService', [
  'Browse', 'Upload', 'API_ENDPOINT_ENDPOINTS', 'EndpointProvider', '$q',
  function HostBrowserServiceFactory(Browse, Upload, API_ENDPOINT_ENDPOINTS, EndpointProvider, $q) {
    var service = {};

    service.ls = ls;
    service.get = get;
    service.delete = deletePath;
    service.rename = rename;
    service.upload = upload;

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

    function upload(path, file, onProgress) {
      var deferred = $q.defer();
      var url = API_ENDPOINT_ENDPOINTS + '/' + EndpointProvider.endpointID() + '/docker/browse/put';
      Upload.upload({
        url: url,  
        data: { file: file, Path: path }
      }).then(deferred.resolve, deferred.reject, onProgress);
      return deferred.promise;
    }

    return service;
  }
]);

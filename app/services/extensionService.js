angular.module('portainer.services')
.factory('ExtensionService', ['$q', 'PluginService', function ExtensionServiceFactory($q, PluginService) {
  'use strict';

  var service = {};

  service.extensions = function(checkPlugins) {
    var deferred = $q.defer();
    var extensions = [];

    PluginService.volumePlugins()
    .then(function success(data) {
      var volumePlugins = data;
      if (_.includes(volumePlugins, 'cio:latest')) {
        extensions.push('storidge');
      }
      deferred.resolve(extensions);
    })
    .catch(function error(err) {
      deferred.reject({ msg: 'Unable to retrieve extensions', err: err });
    });

    return deferred.promise;
  };

  return service;
}]);

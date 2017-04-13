angular.module('portainer.services')
.factory('InfoService', ['$q', 'Info', function InfoServiceFactory($q, Info) {
  'use strict';
  var service = {};

  service.getVolumePlugins = function() {
    var deferred = $q.defer();
    Info.get({}).$promise
    .then(function success(data) {
      var plugins = data.Plugins.Volume;
      deferred.resolve(plugins);
    })
    .catch(function error(err) {
      deferred.reject({msg: 'Unable to retrieve volume plugin information', err: err});
    });
    return deferred.promise;
  };

  return service;
}]);

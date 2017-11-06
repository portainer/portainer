angular.module('portainer.services')
.factory('OrcaProjectService', ['$q', 'OrcaProject', 'OrcaProjectHelper', 'ResourceControlService', function OrcaProjectServiceFactory($q, OrcaProject, OrcaProjectHelper, ResourceControlService) {
  'use strict';
  var project = {};

  project.create = function(id, driver) {
    var deferred = $q.defer();

    OrcaProject.create({ id: id,  driver: driver}).$promise
    .then(function success(data) {
      deferred.resolve(data);
    })
    .catch(function error(err) {
      deferred.reject({ msg: 'Unable to create project', err: err });
    });

    return deferred.promise;
  };

  return project;
}]);

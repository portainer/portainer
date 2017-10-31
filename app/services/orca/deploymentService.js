angular.module('portainer.services')
.factory('DeploymentService', ['$q', 'Deployment', 'DeploymentHelper', 'ResourceControlService', function DeploymentServiceFactory($q, Deployment, DeploymentHelper, ResourceControlService) {
  'use strict';
  var deployment = {};

  deployment.deployments = function(filters) {
    var deferred = $q.defer();

    //Deployment.query({ filters: filters ? filters : {} }).$promise
    Deployment.query().$promise
    .then(function success(data) {
      var deployments = data.map(function (item) {
        return new DeploymentViewModel(item);
      });
      deferred.resolve(deployments);
    })
    .catch(function error(err) {
      deferred.reject({ msg: 'Unable to retrieve deployments', err: err });
    });

    return deferred.promise;
  };

  deployment.deployment = function(id) {
    var deferred = $q.defer();

    Deployment.get({ id: id }).$promise
    .then(function success(data) {
      var deployment = new DeploymentViewModel(data);
      deferred.resolve(deployment);
    })
    .catch(function error(err) {
      deferred.reject({ msg: 'Unable to retrieve deployment details', err: err });
    });

    return deferred.promise;
  };

  deployment.remove = function(deployment) {
    var deferred = $q.defer();

    Deployment.remove({id: deployment.Id}).$promise
    .then(function success() {
      if (service.ResourceControl && service.ResourceControl.Type === 2) {
        return ResourceControlService.deleteResourceControl(deployment.ResourceControl.Id);
      }
    })
    .then(function success() {
      deferred.resolve();
    })
    .catch(function error(err) {
      deferred.reject({ msg: 'Unable to remove deployment', err: err });
    });

    return deferred.promise;
  };

  return deployment;
}]);

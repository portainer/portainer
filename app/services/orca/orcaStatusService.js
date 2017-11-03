angular.module('portainer.services')
.factory('OrcaStatusService', ['$q', 'OrcaStatus', 'OrcaStatusHelper', 'ResourceControlService', function OrcaStatusServiceFactory($q, OrcaStatus, OrcaStatusHelper, ResourceControlService) {
  'use strict';
  var status = {};

  status.status = function(id) {
    var deferred = $q.defer();

    OrcaStatus.get({ id: id }).$promise
    .then(function success(data) {
      if (data[0]) {
        var status = data.map(function (item) {
            return new OrcaStatusViewModel(item);
        });
      } else {
        var status = new OrcaStatusViewModel(data);
      }
      deferred.resolve(status);
    })
    .catch(function error(err) {
      deferred.reject({ msg: 'Unable to retrieve message status', err: err });
    });

    return deferred.promise;
  };

  return status;
}]);

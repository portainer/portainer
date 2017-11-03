angular.module('portainer.services')
.factory('OperationService', ['$q', 'Operation', 'OperationHelper', 'ResourceControlService', function OperationServiceFactory($q, Operation, OperationHelper, ResourceControlService) {
  'use strict';
  var operation = {};

  operation.operation = function(id) {
    var deferred = $q.defer();

    Operation.get({ id: id }).$promise
    .then(function success(data) {
      var operation = new OperationViewModel(data);
      deferred.resolve(operation);
    })
    .catch(function error(err) {
      deferred.reject({ msg: 'Unable to retrieve operation', err: err });
    });

    return deferred.promise;
  };

  return operation;
}]);

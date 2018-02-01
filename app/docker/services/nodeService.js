angular.module('portainer.docker')
.factory('NodeService', ['$q', 'Node', function NodeServiceFactory($q, Node) {
  'use strict';
  var service = {};

  service.nodes = function() {
    var deferred = $q.defer();

    Node.query({}).$promise
    .then(function success(data) {
      var nodes = data.map(function (item) {
        return new NodeViewModel(item);
      });
      deferred.resolve(nodes);
    })
    .catch(function error(err) {
      deferred.reject({ msg: 'Unable to retrieve nodes', err: err });
    });

    return deferred.promise;
  };

  return service;
}]);

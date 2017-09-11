angular.module('extension.storidge')
.factory('StoridgeNodeService', ['$q', 'StoridgeNodes', function StoridgeNodeServiceFactory($q, StoridgeNodes) {
  'use strict';
  var service = {};

  service.nodes = function() {
    var deferred = $q.defer();

    StoridgeNodes.query()
    .then(function success(response) {
      var nodeData = response.data.nodes;
      var nodes = [];

      for (var key in nodeData) {
        if (nodeData.hasOwnProperty(key)) {
          nodes.push(new StoridgeNodeModel(key, nodeData[key]));
        }
      }

      deferred.resolve(nodes);
    })
    .catch(function error(err) {
      deferred.reject({ msg: 'Unable to retrieve Storidge profiles', err: err });
    });

    return deferred.promise;
  };

  return service;
}]);

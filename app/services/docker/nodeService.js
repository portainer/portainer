angular.module('portainer.services')
.factory('NodeService', ['$q', 'CloudNode', 'Node', function NodeServiceFactory($q, CloudNode, Node) {
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

  service.start = function(node) {
    var deferred = $q.defer();

    CloudNode.start({id: node.Addr}).$promise
    .then(function success(data) {
      if (data.message) {
        deferred.reject({ msg: data.message, err: data.message });
      }
      console.log("Started node " + node.Id)
    })
    .then(function success() {
      deferred.resolve();
    })
    .catch(function error(err) {
      deferred.reject({ msg: 'Unable to start node', err: err });
    });

    return deferred.promise;
  };

  service.stop = function(node) {
    var deferred = $q.defer();

    CloudNode.stop({id: node.Addr}).$promise
    .then(function success(data) {
      if (data.message) {
        deferred.reject({ msg: data.message, err: data.message });
      }
      console.log("Stopped node " + node.Id)
    })
    .then(function success() {
      deferred.resolve();
    })
    .catch(function error(err) {
      deferred.reject({ msg: 'Unable to stop node', err: err });
    });

    return deferred.promise;
  };

  return service;
}]);

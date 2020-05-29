import { NodeViewModel } from '../models/node';

angular.module('portainer.docker').factory('NodeService', [
  '$q',
  'Node',
  function NodeServiceFactory($q, Node) {
    'use strict';
    var service = {};

    service.nodes = nodes;
    service.node = node;
    service.updateNode = updateNode;
    service.getActiveManager = getActiveManager;

    function node(id) {
      var deferred = $q.defer();
      Node.get({ id: id })
        .$promise.then(function onNodeLoaded(rawNode) {
          var node = new NodeViewModel(rawNode);
          return deferred.resolve(node);
        })
        .catch(function onFailed(err) {
          deferred.reject({ msg: 'Unable to retrieve node', err: err });
        });

      return deferred.promise;
    }

    function nodes() {
      var deferred = $q.defer();

      Node.query({})
        .$promise.then(function success(data) {
          var nodes = data.map(function (item) {
            return new NodeViewModel(item);
          });
          deferred.resolve(nodes);
        })
        .catch(function error(err) {
          deferred.reject({ msg: 'Unable to retrieve nodes', err: err });
        });

      return deferred.promise;
    }

    function updateNode(node) {
      return Node.update({ id: node.Id, version: node.Version }, node).$promise;
    }

    function getActiveManager() {
      var deferred = $q.defer();

      service
        .nodes()
        .then(function success(data) {
          for (var i = 0; i < data.length; ++i) {
            var node = data[i];
            if (node.Role === 'manager' && node.Availability === 'active' && node.Status === 'ready' && node.Addr !== '0.0.0.0') {
              deferred.resolve(node);
              break;
            }
          }
        })
        .catch(function error(err) {
          deferred.reject({ msg: 'Unable to retrieve nodes', err: err });
        });

      return deferred.promise;
    }

    return service;
  },
]);

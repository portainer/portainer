import { NamespaceModel } from '../../models/namespace';

angular.module('portainer.app').factory('NamespaceService', [
  'Namespaces',
  function NamespaceService(Namespaces) {
    'use strict';
    let service = {};

    service.createNamespace = function (data) {
      const payload = new NamespaceModel(data);
      return Namespaces.create(payload).$promise;
    };

    service.deleteNamespace = function (name) {
      return Namespaces.remove({ id: name }).$promise;
    };

    service.namespaces = function () {
      return Namespaces.query({}).$promise;
    };

    service.containers = function (name) {
      console.log('name = ' + name);

      return Namespaces.containers({id: name}).$promise;
    }

    return service;
  },
]);

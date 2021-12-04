import { WebhookViewModel } from '../../models/webhook';

angular.module('portainer.app').factory('WebhookService', [
  '$q',
  'Webhooks',
  function WebhookServiceFactory($q, Webhooks) {
    'use strict';
    var service = {};

    service.webhooks = function (serviceID, endpointID) {
      var deferred = $q.defer();
      var filters = { ResourceID: serviceID, EndpointID: endpointID };

      Webhooks.query({ filters: filters })
        .$promise.then(function success(data) {
          var webhooks = data.map(function (item) {
            return new WebhookViewModel(item);
          });
          deferred.resolve(webhooks);
        })
        .catch(function error(err) {
          deferred.reject({ msg: 'Unable to retrieve webhooks', err: err });
        });

      return deferred.promise;
    };

    service.createServiceWebhook = function (serviceID, endpointID, registryID) {
      return Webhooks.create({ ResourceID: serviceID, EndpointID: endpointID, WebhookType: 1, registryID }).$promise;
    };

    service.updateServiceWebhook = function (id, registryID) {
      return Webhooks.update({ id, registryID }).$promise;
    };

    service.deleteWebhook = function (id) {
      return Webhooks.remove({ id: id }).$promise;
    };

    return service;
  },
]);

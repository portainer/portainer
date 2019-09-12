import _ from 'lodash-es';
import KubernetesEventViewModel from '../models/event';

angular.module('portainer.kubernetes')
  .factory('KubernetesEventService', ['$async', 'KubernetesEvents',
    function KubernetesEventServiceFactory($async, KubernetesEvents) {
      'use strict';
      var service = {};

      async function eventsAsync(namespace) {
        try {
          const data = await KubernetesEvents(namespace).query({}).$promise;
          return _.map(data.items, (item) => new KubernetesEventViewModel(item));
        } catch (err) {
          throw {msg: 'Unable to retrieve events', err:err};
        }
      }

      service.events = function(namespace) {
        return $async(eventsAsync, namespace);
      };

      return service;
    }]);

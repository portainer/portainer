import _ from 'lodash-es';
import KubernetesPodViewModel from '../models/pod';

angular.module('portainer.kubernetes')
  .factory('KubernetesPodService', ['$async', 'KubernetesPods',
    function KubernetesPodServiceFactory($async, KubernetesPods) {
      'use strict';
      var service = {};

      async function podsAsync() {
        try {
          const data = await KubernetesPods.query({}).$promise;
          return _.map(data.items, (item) => new KubernetesPodViewModel(item));
        } catch (err) {
          throw {msg: 'Unable to retrieve pods', err:err};
        }
      }

      service.pods = function() {
        return $async(podsAsync);
      };

      return service;
    }]);

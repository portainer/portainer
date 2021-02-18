export const API_ENDPOINT_MOTD = 'api/motd';

angular.module('portainer.app').factory('Motd', [
  '$resource',
  function MotdFactory($resource) {
    'use strict';
    return $resource(
      API_ENDPOINT_MOTD,
      {},
      {
        get: {
          method: 'GET',
          ignoreLoadingBar: true,
        },
      }
    );
  },
]);

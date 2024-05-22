import { getSwarm } from '@/react/docker/proxy/queries/useSwarm';

angular.module('portainer.docker').factory('SwarmService', SwarmServiceFactory);

/* @ngInject */
function SwarmServiceFactory() {
  return {
    swarm: getSwarm,
  };
}

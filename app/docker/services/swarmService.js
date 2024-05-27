import { getSwarm } from '@/react/docker/proxy/queries/useSwarm';

angular.module('portainer.docker').factory('SwarmService', SwarmServiceFactory);

/* @ngInject */
function SwarmServiceFactory(AngularToReact) {
  const { useAxios } = AngularToReact;

  return {
    swarm: useAxios(getSwarm), // stack service
  };
}

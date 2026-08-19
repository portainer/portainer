import { ping } from '@/react/docker/proxy/queries/usePing';
import { getInfo } from '@/react/docker/proxy/queries/useInfo';
import { getVersion } from '@/react/docker/proxy/queries/useVersion';

angular.module('portainer.docker').factory('SystemService', SystemServiceFactory);

/* @ngInject */
function SystemServiceFactory(AngularToReact) {
  const { useAxios, injectEnvironmentId } = AngularToReact;

  return {
    info: useAxios(injectEnvironmentId(getInfo)), // dashboard + docker host view + docker host browser + swarm inspect views + stateManager (update endpoint state)
    ping: useAxios(ping), // docker/__module onEnter abstract /docker subpath
    version: useAxios(injectEnvironmentId(getVersion)), // docker host view + swarm inspect view + stateManager (update endpoint state)
  };
}

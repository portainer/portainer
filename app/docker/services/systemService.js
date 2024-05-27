import { ping } from '@/react/docker/proxy/queries/usePing';
import { getInfo } from '@/react/docker/proxy/queries/useInfo';
import { getVersion } from '@/react/docker/proxy/queries/useVersion';
import { getEvents } from '@/react/docker/proxy/queries/useEvents';
import { EventViewModel } from '../models/event';

angular.module('portainer.docker').factory('SystemService', SystemServiceFactory);

/* @ngInject */
function SystemServiceFactory(AngularToReact) {
  const { useAxios, injectEnvironmentId } = AngularToReact;

  return {
    info: useAxios(injectEnvironmentId(getInfo)), // dashboard + docker host view + docker host browser + swarm inspect views + stateManager (update endpoint state)
    ping: useAxios(ping), // docker/__module onEnter abstract /docker subpath
    version: useAxios(injectEnvironmentId(getVersion)), // docker host view + swarm inspect view + stateManager (update endpoint state)
    events: useAxios(injectEnvironmentId(eventsAngularJS)), // events list
  };

  /**
   * @param {EnvironmentId} environmentId Injected
   * @param {{since: string; until: string;}} param1
   */
  async function eventsAngularJS(environmentId, { since, until }) {
    const data = await getEvents(environmentId, { since, until });
    return data.map((e) => new EventViewModel(e));
  }
}

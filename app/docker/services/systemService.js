import { ping } from '@/react/docker/proxy/queries/usePing';
import { getInfo } from '@/react/docker/proxy/queries/useInfo';
import { getVersion } from '@/react/docker/proxy/queries/useVersion';
import { getEvents } from '@/react/docker/proxy/queries/useEvents';
import { EventViewModel } from '../models/event';

angular.module('portainer.docker').factory('SystemService', SystemServiceFactory);

/* @ngInject */
function SystemServiceFactory(AngularToReact) {
  return {
    info: AngularToReact.useAxios(getInfo), // dashboard + docker host view + docker host browser + swarm inspect views + stateManager (update endpoint state)
    ping, // docker/__module onEnter abstract /docker subpath
    version: AngularToReact.useAxios(getVersion), // docker host view + swarm inspect view + stateManager (update endpoint state)
    events: AngularToReact.useAxios(eventsAngularJS), // events list
  };

  /**
   * @param {EnvironmentId} environmentId
   * @param {*} param1
   */
  async function eventsAngularJS(environmentId, { since, until }) {
    const data = await getEvents(environmentId, { since, until });
    return data.map((e) => new EventViewModel(e));
  }
}

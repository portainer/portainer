import angular from 'angular';
import {
  killContainer,
  pauseContainer,
  removeContainer,
  renameContainer,
  restartContainer,
  resumeContainer,
  startContainer,
  stopContainer,
  recreateContainer,
  getContainerLogs,
} from '@/react/docker/containers/containers.service';
import { getContainers } from '@/react/docker/containers/queries/useContainers';
import { getContainer } from '@/react/docker/containers/queries/useContainer';
import { resizeTTY } from '@/react/docker/containers/queries/useContainerResizeTTYMutation';
import { updateContainer } from '@/react/docker/containers/queries/useUpdateContainer';
import { createExec } from '@/react/docker/containers/queries/useCreateExecMutation';
import { containerStats } from '@/react/docker/containers/queries/useContainerStats';
import { containerTop } from '@/react/docker/containers/queries/useContainerTop';

import { ContainerDetailsViewModel } from '../models/containerDetails';
import { ContainerStatsViewModel } from '../models/containerStats';
import { formatLogs } from '../helpers/logHelper';

angular.module('portainer.docker').factory('ContainerService', ContainerServiceFactory);

/* @ngInject */
function ContainerServiceFactory() {
  return {
    killContainer, // container edit
    pauseContainer, // container edit
    renameContainer, // container edit
    restartContainer, // container edit
    resumeContainer, // container edit
    startContainer, // container edit
    stopContainer, // container edit
    recreateContainer, // container edit
    remove: removeContainer, // container edit
    container: getContainerAngularJS, // container console  + container edit + container stats
    containers: getContainers, // dashboard + services list + service edit + voluem edit + stackservice + stack create + stack edit
    resizeTTY: resizeTTYAngularJS, // container console
    updateRestartPolicy: updateRestartPolicyAngularJS, // container edit
    createExec, // container console
    containerStats: containerStatsAngularJS, // container stats
    containerTop, // container stats
    inspect: getContainer, // container inspect
    logs: containerLogsAngularJS, // container logs
  };

  /**
   * @param {EnvironmentId} environmentId
   * @param {ContainerId} id
   * @param {*} param2
   */
  async function getContainerAngularJS(environmentId, id, { nodeName } = {}) {
    const data = await getContainer(environmentId, id, { nodeName });
    return new ContainerDetailsViewModel(data);
  }

  /**
   * @param {EnvironmentId} environmentId
   * @param {string} containerId
   * @param {number} width
   * @param {number} height
   * @param timeout DEPRECATED: Previously used in pure AJS implementation
   */
  async function resizeTTYAngularJS(environmentId, containerId, width, height) {
    return resizeTTY(environmentId, containerId, { width, height });
  }

  /**
   * @param {EnvironmentId} environmentId
   * @param {ContainerId} id
   * @param {RestartPolicy['Name']} restartPolicy
   * @param {RestartPolicy['MaximumRetryCount']} maximumRetryCounts
   */
  async function updateRestartPolicyAngularJS(environmentId, id, restartPolicy, maximumRetryCounts) {
    return updateContainer(environmentId, id, {
      RestartPolicy: {
        Name: restartPolicy,
        MaximumRetryCount: maximumRetryCounts,
      },
    });
  }

  /**
   * @param {EnvironmentId} environmentId
   * @param {ContainerId} id
   */
  async function containerStatsAngularJS(environmentId, id) {
    const data = await containerStats(environmentId, id);
    return new ContainerStatsViewModel(data);
  }

  /**
   * @param {EnvironmentId} environmentId
   * @param {Containerid} id
   * @param {boolean?} stdout
   * @param {boolean?} stderr
   * @param {boolean?} timestamps
   * @param {number?} since
   * @param {number?} tail
   * @param {boolean?} stripHeaders
   */
  async function containerLogsAngularJS(environmentId, id, stdout = false, stderr = false, timestamps = false, since = 0, tail = 'all', stripHeaders) {
    const data = await getContainerLogs(environmentId, id, {
      since,
      stderr,
      stdout,
      tail,
      timestamps,
    });
    return formatLogs(data, { stripHeaders, withTimestamps: !!timestamps });
  }
}

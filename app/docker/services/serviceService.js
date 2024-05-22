import { removeService } from '@/react/docker/services/ListView/ServicesDatatable/useRemoveServicesMutation';
import { createService } from '@/react/docker/services/queries/useCreateServiceMutation';
import { getService } from '@/react/docker/services/queries/useService';
import { getServices } from '@/react/docker/services/queries/useServices';
import { updateService } from '@/react/docker/services/queries/useUpdateServiceMutation';
import { getServiceLogs } from '@/react/docker/services/queries/useServiceLogs';

import { ServiceViewModel } from '../models/service';
import { formatLogs } from '../helpers/logHelper';

angular.module('portainer.docker').factory('ServiceService', ServiceServiceFactory);

/* @ngInject */
function ServiceServiceFactory(AngularToReact) {
  return {
    services: AngularToReact.useAxios(async (environmentId, filters) => {
      const data = await getServices(environmentId, filters);
      return data.map((s) => new ServiceViewModel(s));
    }), // dashboard + service list + swarm visualizer + volume list + stackservice + stack edit
    service: AngularToReact.useAxios(async (environmentId, serviceId) => {
      const data = await getService(environmentId, serviceId);
      return new ServiceViewModel(data);
    }), // service edit + task edit
    remove: AngularToReact.useAxios(async (environmentId, service) => removeService(environmentId, service.Id)), // service edit
    update: AngularToReact.useAxios(async (environmentId, service, config, rollback) =>
      updateService({
        environmentId,
        config,
        serviceId: service.Id,
        version: service.Version,
        registryId: config.registryId,
        rollback,
      })
    ), // service edit
    create: AngularToReact.useAxios(async (environmentId, config, registryId) =>
      createService({
        environmentId,
        config,
        registryId,
      })
    ), // service create
    logs: AngularToReact.useAxios(serviceLogsAngularJS), // service logs
  };

  /**
   * @param {EnvironmentId} environmentId
   * @param {ServiceId} id
   * @param {boolean?} stdout
   * @param {boolean?} stderr
   * @param {boolean?} timestamps
   * @param {number?} since
   * @param {number?} tail
   */
  async function serviceLogsAngularJS(environmentId, id, stdout = false, stderr = false, timestamps = false, since = 0, tail = 'all') {
    const data = await getServiceLogs(environmentId, id, {
      since,
      stderr,
      stdout,
      tail,
      timestamps,
    });
    return formatLogs(data, { stripHeaders: true, withTimestamps: !!timestamps });
  }
}

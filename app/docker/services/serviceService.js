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
  const { useAxios, injectEnvironmentId } = AngularToReact;

  return {
    services: useAxios(injectEnvironmentId(getServicesAngularJS)), // dashboard + service list + swarm visualizer + volume list + stackservice + stack edit
    service: useAxios(injectEnvironmentId(getServiceAngularJS)), // service edit + task edit
    remove: useAxios(injectEnvironmentId(removeServiceAngularJS)), // service edit
    update: useAxios(injectEnvironmentId(updateServiceAngularJS)), // service edit
    create: useAxios(injectEnvironmentId(createServiceAngularJS)), // service create
    logs: useAxios(injectEnvironmentId(serviceLogsAngularJS)), // service logs
  };

  /**
   * @param {EnvironmentId} environmentId Injected
   * @param {*} filters
   */
  async function getServicesAngularJS(environmentId, filters) {
    const data = await getServices(environmentId, filters);
    return data.map((s) => new ServiceViewModel(s));
  }

  /**
   * @param {EnvironmentId} environmentId Injected
   * @param {ServiceId} serviceId
   */
  async function getServiceAngularJS(environmentId, serviceId) {
    const data = await getService(environmentId, serviceId);
    return new ServiceViewModel(data);
  }

  /**
   * @param {EnvironmentId} environmentId Injected
   * @param {ServiceViewModel} service
   */
  async function removeServiceAngularJS(environmentId, service) {
    return removeService(environmentId, service.Id);
  }

  /**
   * @param {EnvironmentId} environmentId Injected
   * @param {ServiceViewModel} service
   * @param {ServiceUpdateConfig} config
   * @param {string?} rollback
   */
  async function updateServiceAngularJS(environmentId, service, config, rollback) {
    const data = await getServiceAngularJS(environmentId, service.Id);
    return updateService({
      environmentId,
      config,
      serviceId: service.Id,
      version: data.Version,
      registryId: config.registryId,
      rollback,
    });
  }

  /**
   * @param {EnvironmentId} environmentId Injected
   * @param {Service} config
   * @param {RegistryId} registryId
   */
  async function createServiceAngularJS(environmentId, config, registryId) {
    return createService({ environmentId, config, registryId });
  }

  /**
   * @param {EnvironmentId} environmentId Injected
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

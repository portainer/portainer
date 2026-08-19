import { getVolumes } from '@/react/docker/volumes/queries/useVolumes';
import { getVolume } from '@/react/docker/volumes/queries/useVolume';
import { removeVolume } from '@/react/docker/volumes/queries/useRemoveVolumeMutation';
import { createVolume } from '@/react/docker/volumes/queries/useCreateVolumeMutation';

import { VolumeViewModel } from '../models/volume';

angular.module('portainer.docker').factory('VolumeService', VolumeServiceFactory);

/* @ngInject */
function VolumeServiceFactory(AngularToReact) {
  const { useAxios, injectEnvironmentId } = AngularToReact;

  return {
    volumes: useAxios(injectEnvironmentId(volumesAngularJS)), // dashboard + service create + service edit + volume list
    volume: useAxios(injectEnvironmentId(volumeAngularJS)), // volume edit
    getVolumes: useAxios(injectEnvironmentId(getVolumesAngularJS)), // template list
    remove: useAxios(injectEnvironmentId(removeAngularJS)), // volume list + volume edit
    createVolume: useAxios(injectEnvironmentId(createAngularJS)), // volume create
    createVolumeConfiguration, // volume create
  };

  /**
   * @param {EnvironmentId} environmentId Injected
   * @param {Filters} filters
   */
  async function volumesAngularJS(environmentId, filters) {
    const data = await getVolumes(environmentId, filters);
    return data.map((v) => new VolumeViewModel(v));
  }

  /**
   * @param {EnvironmentId} environmentId Injected
   * @param {string} id
   */
  async function volumeAngularJS(environmentId, id) {
    const data = await getVolume(environmentId, id);
    return new VolumeViewModel(data);
  }

  /**
   * @param {EnvironmentId} environmentId Injected
   */
  async function getVolumesAngularJS(environmentId) {
    return getVolumes(environmentId);
  }

  /**
   * @param {EnvironmentId} environmentId Injected
   * @param {string} name
   * @param {string?} nodeName
   */
  async function removeAngularJS(environmentId, name, nodeName) {
    return removeVolume(environmentId, name, { nodeName });
  }

  /**
   * @param {string} name
   * @param {string} driver
   * @param {{name: string; value: string;}[]} driverOptions
   */
  function createVolumeConfiguration(name, driver, driverOptions) {
    return {
      Name: name,
      Driver: driver,
      DriverOpts: driverOptions.reduce((res, { name, value }) => ({ ...res, [name]: value }), {}),
    };
  }

  /**
   * @param {EnvironmentId} environmentId Injected
   * @param {VolumeConfiguration} volumeConfiguration
   * @param {string?} nodeName
   */
  async function createAngularJS(environmentId, volumeConfiguration, nodeName) {
    const data = await createVolume(environmentId, volumeConfiguration, { nodeName });
    return new VolumeViewModel(data);
  }
}

import { getVolumes } from '@/react/docker/volumes/queries/useVolumes';
import { getVolume } from '@/react/docker/volumes/queries/useVolume';
import { removeVolume } from '@/react/docker/volumes/queries/useRemoveVolumeMutation';
import { createVolume } from '@/react/docker/volumes/queries/useCreateVolumeMutation';

import { VolumeViewModel } from '../models/volume';

angular.module('portainer.docker').factory('VolumeService', VolumeServiceFactory);

/* @ngInject */
function VolumeServiceFactory(AngularToReact) {
  return {
    volumes: AngularToReact.useAxios(volumesAngularJS), // dashboard + service create + service edit + volume list
    volume: AngularToReact.useAxios(volumeAngularJS), // volume edit
    getVolumes: AngularToReact.useAxios(getVolumesAngularJS), // template list
    remove: AngularToReact.useAxios(removeAngularJS), // volume list + volume edit
    createVolumeConfiguration, // volume create
    createVolume: AngularToReact.useAxios(createAngularJS), // volume create
  };

  /**
   * @param {EnvironmentId} environmentId autofilled by AngularToReact
   * @param {Filters} filters
   */
  async function volumesAngularJS(environmentId, filters) {
    const data = await getVolumes(environmentId, filters);
    return data.map((v) => new VolumeViewModel(v));
  }

  /**
   * @param {EnvironmentId} environmentId autofilled by AngularToReact
   * @param {string} id
   */
  async function volumeAngularJS(environmentId, id) {
    const data = await getVolume(environmentId, id);
    return new VolumeViewModel(data);
  }

  /**
   * @param {EnvironmentId} environmentId autofilled by AngularToReact
   */
  async function getVolumesAngularJS(environmentId) {
    return getVolumes(environmentId);
  }

  /**
   * @param {EnvironmentId} environmentId autofilled by AngularToReact
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
   * @param {EnvironmentId} environmentId autofilled by AngularToReact
   * @param {VolumeConfiguration} volumeConfiguration
   * @param {string?} nodeName
   */
  async function createAngularJS(environmentId, volumeConfiguration, nodeName) {
    const data = await createVolume(environmentId, volumeConfiguration, { nodeName });
    return new VolumeViewModel(data);
  }
}

import {
  buildImageFromDockerfileContent,
  buildImageFromDockerfileContentAndFiles,
  buildImageFromURL,
  buildImageFromUpload,
} from '@/react/docker/images/queries/useBuildImageMutation';

import { ImageBuildModel } from '../models/build';

angular.module('portainer.docker').factory('BuildService', BuildServiceFactory);

/* @ngInject */
function BuildServiceFactory(AngularToReact) {
  const { useAxios } = AngularToReact;

  return {
    buildImageFromUpload: useAxios(buildImageFromUploadAngularJS), // build image
    buildImageFromURL: useAxios(buildImageFromURLAngularJS), // build image
    buildImageFromDockerfileContent: useAxios(buildImageFromDockerfileContentAngularJS), // build image
    buildImageFromDockerfileContentAndFiles: useAxios(buildImageFromDockerfileContentAndFilesAngularJS), // build image
  };

  /**
   * @param {EnvironmentId} environmentId
   * @param {string[]} names
   * @param {File} file
   * @param {string} path
   */
  async function buildImageFromUploadAngularJS(environmentId, names, file, path) {
    const data = await buildImageFromUpload(environmentId, names, file, path);
    return new ImageBuildModel(data);
  }

  /**
   * @param {EnvironmentId} environmentId
   * @param {string[]} names
   * @param {string} url
   * @param {string} path
   */
  async function buildImageFromURLAngularJS(environmentId, names, url, path) {
    const data = await buildImageFromURL(environmentId, names, url, path);
    return new ImageBuildModel(data);
  }

  /**
   * @param {EnvironmentId} environmentId
   * @param {string[]} names
   * @param {string} content
   */
  async function buildImageFromDockerfileContentAngularJS(environmentId, names, content) {
    const data = await buildImageFromDockerfileContent(environmentId, names, content);
    return new ImageBuildModel(data);
  }

  /**
   * @param {EnvironmentId} environmentId
   * @param {string[]} names
   * @param {string} content
   * @param {File[]} files
   */
  async function buildImageFromDockerfileContentAndFilesAngularJS(environmentId, names, content, files) {
    const data = await buildImageFromDockerfileContentAndFiles(environmentId, names, content, files);
    return new ImageBuildModel(data);
  }
}

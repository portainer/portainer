import { groupBy } from 'lodash';

import { getUniqueTagListFromImages } from '@/react/docker/images/utils';
import { getImage } from '@/react/docker/proxy/queries/images/useImage';
import { parseAxiosError } from '@/portainer/services/axios';
import { getImages } from '@/react/docker/proxy/queries/images/useImages';
import { getContainers } from '@/react/docker/containers/queries/useContainers';
import { getImageHistory } from '@/react/docker/proxy/queries/images/useImageHistory';
import { pullImage } from '@/react/docker/images/queries/usePullImageMutation';
import { pushImage } from '@/react/docker/images/queries/usePushImageMutation';
import { removeImage } from '@/react/docker/proxy/queries/images/useRemoveImageMutation';
import { tagImage } from '@/react/docker/proxy/queries/images/useTagImageMutation';
import { downloadImages } from '@/react/docker/proxy/queries/images/useDownloadImages';
import { uploadImages } from '@/react/docker/proxy/queries/images/useUploadImageMutation';

import { ImageViewModel } from '../models/image';
import { ImageDetailsViewModel } from '../models/imageDetails';
import { ImageLayerViewModel } from '../models/imageLayer';

angular.module('portainer.docker').factory('ImageService', ImageServiceFactory);

/* @ngInject */
function ImageServiceFactory(AngularToReact) {
  const { useAxios, injectEnvironmentId } = AngularToReact;

  return {
    image: useAxios(injectEnvironmentId(imageAngularJS)), // container console + image edit
    images: useAxios(injectEnvironmentId(imagesAngularJS)), // por image registry controller + dashboard + service edit
    history: useAxios(injectEnvironmentId(historyAngularJS)), // image edit
    pushImage: useAxios(injectEnvironmentId(pushImageAngularJS)), // image edit
    pullImage: useAxios(injectEnvironmentId(pullImageAngularJS)), // images list + image edit + templates list
    tagImage: useAxios(injectEnvironmentId(tagImage)), // image edit + image import
    downloadImages: useAxios(injectEnvironmentId(downloadImages)), // image list + image edit
    uploadImage: useAxios(injectEnvironmentId(uploadImages)), // image import
    deleteImage: useAxios(injectEnvironmentId(removeImage)), // image list + image edit
    getUniqueTagListFromImages, // por image registry controller + service edit
  };

  async function imageAngularJS(environmentId, imageId) {
    const image = await getImage(environmentId, imageId);
    return new ImageDetailsViewModel(image);
  }

  async function imagesAngularJS(environmentId, withUsage) {
    try {
      const [containers, images] = await Promise.all([withUsage ? getContainers(environmentId) : [], getImages(environmentId)]);
      const containerByImageId = groupBy(containers, 'ImageID');
      return images.map((item) => new ImageViewModel(item, !!containerByImageId[item.Id] && containerByImageId[item.Id].length > 0));
    } catch (e) {
      throw parseAxiosError(e, 'Unable to retrieve images');
    }
  }

  async function historyAngularJS(environmentId, imageId) {
    try {
      const layers = await getImageHistory(environmentId, imageId);
      return layers.reverse().map((layer, idx) => new ImageLayerViewModel(idx, layer));
    } catch (e) {
      throw parseAxiosError(e, 'Unable to retrieve image history');
    }
  }

  /**
   * type PorImageRegistryModel = {
   *   UseRegistry: bool;
   *   Registry?: Registry;
   *   Image: string;
   * }
   */

  /**
   * @param {EnvironmentId} environmentId Autofilled by AngularToReact
   * @param {PorImageRegistryModel} registryModel
   */
  async function pushImageAngularJS(environmentId, registryModel) {
    const { UseRegistry, Registry, Image } = registryModel;
    const registry = UseRegistry ? Registry : undefined;
    return pushImage({ environmentId, image: Image, registry });
  }

  /**
   * @param {EnvironmentId} environmentId Autofilled by AngularToReact
   * @param {PorImageRegistryModel} registryModel
   * @param {string?} nodeName
   */
  async function pullImageAngularJS(environmentId, registryModel, nodeName) {
    const { UseRegistry, Registry, Image } = registryModel;
    const registry = UseRegistry ? Registry : undefined;
    return pullImage({ environmentId, image: Image, nodeName, registry });
  }
}

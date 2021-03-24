import _ from 'lodash-es';
import { RegistryTypes } from '@/portainer/models/registryTypes';

angular.module('portainer.docker').factory('ImageHelper', [
  function ImageHelperFactory() {
    'use strict';

    var helper = {};

    helper.isValidTag = isValidTag;
    helper.createImageConfigForContainer = createImageConfigForContainer;
    helper.getImagesNamesForDownload = getImagesNamesForDownload;
    helper.removeDigestFromRepository = removeDigestFromRepository;
    helper.imageContainsURL = imageContainsURL;

    function isValidTag(tag) {
      return tag.match(/^(?![\.\-])([a-zA-Z0-9\_\.\-])+$/g);
    }

    function getImagesNamesForDownload(images) {
      var names = images.map(function (image) {
        return image.RepoTags[0] !== '<none>:<none>' ? image.RepoTags[0] : image.Id;
      });
      return {
        names: names,
      };
    }

    /**
     *
     * @param {PorImageRegistryModel} registry
     */
    function createImageConfigForContainer(registry) {
      const data = {
        fromImage: '',
      };
      let fullImageName = '';

      if (registry.UseRegistry) {
        if (registry.Registry.Type === RegistryTypes.GITLAB) {
          const slash = _.startsWith(registry.Image, ':') ? '' : '/';
          fullImageName = registry.Registry.URL + '/' + registry.Registry.Gitlab.ProjectPath + slash + registry.Image;
        } else if (registry.Registry.Type === RegistryTypes.QUAY) {
          const name = registry.Registry.Quay.UseOrganisation ? registry.Registry.Quay.OrganisationName : registry.Registry.Username;
          const url = registry.Registry.URL ? registry.Registry.URL + '/' : '';
          fullImageName = url + name + '/' + registry.Image;
        } else {
          const url = registry.Registry.URL ? registry.Registry.URL + '/' : '';
          fullImageName = url + registry.Image;
        }
        if (!_.includes(registry.Image, ':')) {
          fullImageName += ':latest';
        }
      } else {
        fullImageName = registry.Image;
      }

      data.fromImage = fullImageName;
      return data;
    }

    function imageContainsURL(image) {
      const split = _.split(image, '/');
      const url = split[0];
      if (split.length > 1) {
        return _.includes(url, '.') || _.includes(url, ':');
      }
      return false;
    }

    function removeDigestFromRepository(repository) {
      return repository.split('@sha')[0];
    }

    return helper;
  },
]);

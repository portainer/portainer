import _ from 'lodash-es';

angular.module('portainer.docker')
.factory('ImageHelper', [function ImageHelperFactory() {
  'use strict';

  var helper = {};

  helper.isValidTag = isValidTag;
  helper.createImageConfigForContainer = createImageConfigForContainer;

  function isValidTag(tag) {
    return tag.match(/^(?![\.\-])([a-zA-Z0-9\_\.\-])+$/g);
  }

  // helper.extractImageAndRegistryFromRepository = function(repository) {
  //   var slashCount = _.countBy(repository)['/'];
  //   var registry = null;
  //   var image = repository;
  //   if (slashCount >= 1) {
  //     // assume something/something[/...]
  //     registry = repository.substr(0, repository.indexOf('/'));
  //     // assume valid DNS name or IP (contains at least one '.')
  //     if (_.countBy(registry)['.'] > 0) {
  //       image = repository.substr(repository.indexOf('/') + 1);
  //     } else {
  //       registry = null;
  //     }
  //   }

  //   return {
  //     registry: registry,
  //     image: image
  //   };
  // };

  helper.getImagesNamesForDownload = function(images) {
    var names = images.map(function(image) {
      return image.RepoTags[0] !== '<none>:<none>' ? image.RepoTags[0] : image.Id;
    });
    return {
      names: names
    };
  };

  /**
   * 
   * @param {PorImageRegistryModel} registry
   */
  function createImageConfigForContainer(registry) {
    console.log('registry', registry);
    const data = {
      fromImage: ''
    };
    let fullImageName = '';

    if (registry.UseRegistry) {
      fullImageName = registry.Registry.URL + '/' + registry.Image;
      if (!_.includes(registry.Image, ':')) {
        fullImageName += ':latest';
      }
    } else {
      fullImageName = registry.Image;
    }

    data.fromImage = fullImageName;
    console.log('FULL IMAGE NAME', fullImageName);
    return data;
  }

  helper.removeDigestFromRepository = function(repository) {
    return repository.split('@sha')[0];
  };

  return helper;
}]);

// import _ from 'lodash-es';

angular.module('portainer.docker')
.factory('ImageHelper', [function ImageHelperFactory() {
  'use strict';

  var helper = {};

  helper.isValidTag = isValidTag;

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

  helper.createImageConfigForContainer = function (imageName, registry) {
    void registry;
    console.log(imageName);
    return {
      fromImage: imageName
    }
  };

  helper.removeDigestFromRepository = function(repository) {
    return repository.split('@sha')[0];
  };

  return helper;
}]);

import RepositoryTagViewModel from '../models/repositoryTag';

angular.module('portainer.extensions.registrymanagement')
  .factory('RegistryV2Helper', [function RegistryV2HelperFactory() {
    'use strict';

    var helper = {};

    function historyRawToParsed(rawHistory) {
      return angular.fromJson(rawHistory[0].v1Compatibility);
    }

    helper.manifestsToTag = function (manifests) {
      var v1 = manifests.v1;
      var v2 = manifests.v2;

      var history = historyRawToParsed(v1.history);
      var name = v1.tag;
      var os = history.os;
      var arch = v1.architecture;
      var size = v2.layers.reduce(function (a, b) {
        return {
          size: a.size + b.size
        };
      }).size;
      var digest = v2.config.digest;

      return new RepositoryTagViewModel(name, os, arch, size, digest);
    };

    return helper;
  }]);

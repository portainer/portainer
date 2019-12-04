import _ from 'lodash-es';
import { RepositoryTagViewModel } from '../models/repositoryTag';

angular.module('portainer.extensions.registrymanagement')
  .factory('RegistryV2Helper', [function RegistryV2HelperFactory() {
    'use strict';

    var helper = {};

    function historyRawToParsed(rawHistory) {
      return _.map(rawHistory, (item) => angular.fromJson(item.v1Compatibility));
    }

    helper.manifestsToTag = function (manifests) {
      var v1 = manifests.v1;
      var v2 = manifests.v2;

      var history = historyRawToParsed(v1.history);
      var name = v1.tag;
      var os = history[0].os;
      var arch = v1.architecture;
      var size = v2.layers.reduce(function (a, b) {
        return {
          size: a.size + b.size
        };
      }).size;
      var imageId = v2.config.digest;
      var imageDigest = v2.digest;

      return new RepositoryTagViewModel(name, os, arch, size, imageDigest, imageId, v2, history);
    };

    return helper;
  }]);

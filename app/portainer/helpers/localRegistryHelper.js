angular.module('portainer.app')
  .factory('LocalRegistryHelper', [function LocalRegistryHelperFactory() {
    'use strict';

    var helper = {};

    function historyRawToParsed(rawHistory) {
      var history = [];
      for (var i = 0; i < rawHistory.length; i++) {
        var item = rawHistory[i];
        history.push(angular.fromJson(item.v1Compatibility));
      }
      return history;
    }

    helper.manifestsToTag = function (manifests) {
      var v1 = manifests.v1;
      var v2 = manifests.v2;

      var history = historyRawToParsed(v1.history);
      var imageId = history[0].id;
      var name = v1.tag;
      var os = history[0].os;
      var arch = v1.architecture;
      var size = v2.layers.reduce(function (a, b) {
        return {
          size: a.size + b.size
        };
      }).size;
      var digest = v2.digest;
      var repositoryName = v1.name;
      var fsLayers = v1.fsLayers;

      return new RepositoryTagViewModel(name, imageId, os, arch, size, digest, repositoryName, fsLayers, history, v2);
    };

    function historyParsedToRaw(parsedHistory) {
      var history = [];
      for (var i = 0; i < parsedHistory.length; i++) {
        var item = parsedHistory[i];
        history.push({
          v1Compatibility: angular.toJson(item)
        });
      }
      return history;
    }

    helper.tagToManifest = function (tag) {
      var manifest = {};
      manifest.name = tag.RepositoryName;
      manifest.tag = tag.Name;
      manifest.fsLayers = tag.FsLayers;
      manifest.history = historyParsedToRaw(tag.History);
      manifest.schemaVersion = 1;
      manifest.architecture = tag.Architecture;
      return manifest;
    };

    return helper;
  }]);
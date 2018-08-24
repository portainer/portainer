angular.module('portainer.app')
  .factory('LocalRegistryHelper', [function LocalRegistryHelperFactory() {
    'use strict';

    var helper = {};

    /*
     ** Manifests/images history transform
     */

    function historyRawToParsed(rawHistory) {
      var history = [];
      for (var i = 0; i < rawHistory.length; i++) {
        var item = rawHistory[i];
        history.push(angular.fromJson(item.v1Compatibility));
      }
      return history;
    }

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

    /*
     ** Manifests / images transformation
     */

    function groupBy(array, prop) {
      return array.reduce(function (groups, item) {
        var val = item[prop];
        groups[val] = groups[val] || [];
        groups[val].push(item);
        return groups;
      }, {});
    }

    helper.groupImagesTags = function (manifests) {
      var grouped = groupBy(manifests, 'Name');
      for (var prop in grouped) {
        if (grouped.hasOwnProperty(prop)) {
          grouped[prop] = groupBy(grouped[prop], 'Id');
        }
      }
      var images = [];
      for (var name in grouped) {
        if (grouped.hasOwnProperty(name)) {
          for (var id in grouped[name]) {
            if (grouped[name].hasOwnProperty(id)) {
              grouped[name][id].map(function (image) {
                image.Tags = [{
                  Value: image.Tags[0],
                  Digest: image.Digest
                }];
                return image;
              });
              var squashedImage = grouped[name][id].reduce(function (a, b) {
                a.Tags = a.Tags.concat(b.Tags);
                return a;
              });
              images.push(squashedImage);
            }
          }
        }
      }
      return images;
    };

    helper.manifestsToImage = function (manifests) {
      var basicInfo = manifests.basicInfo;
      var details = manifests.details;

      var history = historyRawToParsed(basicInfo.history);
      var id = history[0].id;
      var name = basicInfo.name;
      var tags = [basicInfo.tag];
      var created = history[0].created;
      var size = details.layers.reduce(function (a, b) {
        return {
          size: a.size + b.size
        };
      }).size;
      var digest = details.digest;
      var fsLayers = basicInfo.fsLayers;
      var signatures = basicInfo.signatures;

      return new RepositoryImageViewModel(id, name, tags, created, size, digest, fsLayers, history, signatures, details);
    };

    helper.imageToManifest = function (image) {
      var manifest = {};
      manifest.name = image.Name;
      manifest.tag = tag[0];
      manifest.fsLayers = image.FsLayers;
      manifest.history = historyParsedToRaw(image.History);
      manifest.schemaVersion = 1;
      manifest.architecture = image.History[0].architecture;
      return manifest;
    };

    return helper;
  }]);
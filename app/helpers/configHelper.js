angular.module('portainer.helpers')
.factory('ConfigHelper', [function ConfigHelperFactory() {
  'use strict';
  return {
    flattenConfig: function(config) {
      if (config) {
        return {
          Id: config.ConfigID,
          Name: config.ConfigName,
          FileName: config.File.Name,
          Uid: config.File.UID,
          Gid: config.File.GID,
          Mode: config.File.Mode
        };
      }
      return {};
    },
    configConfig: function(config) {
      if (config) {
        return {
          ConfigID: config.Id,
          ConfigName: config.Name,
          File: {
            Name: config.FileName,
            UID: '0',
            GID: '0',
            Mode: 444
          }
        };
      }
      return {};
    }
  };
}]);

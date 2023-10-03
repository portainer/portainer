angular.module('portainer.docker').factory('ConfigHelper', [
  function ConfigHelperFactory() {
    'use strict';
    return {
      flattenConfig: function (config) {
        if (config) {
          return {
            Id: config.ConfigID,
            Name: config.ConfigName,
            ...(config.File ? { FileName: config.File.Name, Uid: config.File.UID, Gid: config.File.GID, Mode: config.File.Mode } : {}),
            credSpec: !!config.Runtime,
          };
        }
        return {};
      },
      configConfig: function (config) {
        if (config) {
          return {
            ConfigID: config.Id,
            ConfigName: config.Name,
            File: config.credSpec
              ? null
              : {
                  Name: config.FileName || config.Name,
                  UID: config.Uid || '0',
                  GID: config.Gid || '0',
                  Mode: config.Mode || 292,
                },
            Runtime: config.credSpec ? {} : null,
          };
        }
        return {};
      },
    };
  },
]);

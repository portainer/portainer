angular.module('portainer.docker').factory('SecretHelper', [
  function SecretHelperFactory() {
    'use strict';
    return {
      flattenSecret: function (secret) {
        if (secret) {
          return {
            Id: secret.SecretID,
            Name: secret.SecretName,
            FileName: secret.File.Name,
            Uid: secret.File.UID,
            Gid: secret.File.GID,
            Mode: secret.File.Mode,
          };
        }
        return {};
      },
      secretConfig: function (secret) {
        if (secret) {
          return {
            SecretID: secret.Id,
            SecretName: secret.Name,
            File: {
              Name: secret.FileName,
              UID: secret.Uid || '0',
              GID: secret.Gid || '0',
              Mode: secret.Mode || 444,
            },
          };
        }
        return {};
      },
    };
  },
]);

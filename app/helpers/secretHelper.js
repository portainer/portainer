angular.module('portainer.helpers')
.factory('SecretHelper', [function SecretHelperFactory() {
  'use strict';
  return {
    flattenSecret: function(secret) {
      if (secret) {
        return {
          Id: secret.SecretID,
          Name: secret.SecretName,
          FileName: secret.File.Name,
          Uid: secret.File.UID,
          Gid: secret.File.GID,
          Mode: secret.File.Mode
        };
      }
      return {};
    },
    secretConfig: function(secret) {
      if (secret) {
        return {
          SecretID: secret.Id,
          SecretName: secret.Name,
          File: {
            Name: secret.Name,
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

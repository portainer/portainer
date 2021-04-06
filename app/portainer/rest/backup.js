angular.module('portainer.app').factory('Backup', [
  '$resource',
  'API_ENDPOINT_BACKUP',
  function BackupFactory($resource, API_ENDPOINT_BACKUP) {
    'use strict';
    return $resource(
      API_ENDPOINT_BACKUP,
      {},
      {
        download: {
          method: 'POST',
          responseType: 'blob',
          ignoreLoadingBar: true,
          transformResponse: (data, headersGetter) => ({
            file: data,
            name: headersGetter('Content-Disposition').replace('attachment; filename=', ''),
          }),
        },
      }
    );
  },
]);

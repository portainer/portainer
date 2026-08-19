angular.module('portainer.app').factory('Backup', [
  '$resource',
  'API_ENDPOINT_BACKUP',
  function BackupFactory($resource, API_ENDPOINT_BACKUP) {
    'use strict';
    return $resource(
      API_ENDPOINT_BACKUP + '/:subResource/:action',
      {},
      {
        download: {
          method: 'POST',
          responseType: 'arraybuffer',
          ignoreLoadingBar: true,
          transformResponse: (data, headersGetter, status) => {
            if (status !== 200) {
              const decoder = new TextDecoder('utf-8');
              const str = decoder.decode(data);
              return JSON.parse(str);
            }

            return {
              file: data,
              name: headersGetter('Content-Disposition').replace('attachment; filename=', ''),
            };
          },
        },
        getS3Settings: { method: 'GET', params: { subResource: 's3', action: 'settings' } },
        saveS3Settings: { method: 'POST', params: { subResource: 's3', action: 'settings' } },
        exportS3Backup: { method: 'POST', params: { subResource: 's3', action: 'execute' } },
        restoreS3Backup: { method: 'POST', params: { subResource: 's3', action: 'restore' } },
      }
    );
  },
]);

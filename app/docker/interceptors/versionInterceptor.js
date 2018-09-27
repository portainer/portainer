var g_version = {
  'Platform': {
    'Name': ''
  },
  'Components': [{
    'Name': 'Engine',
    'Version': '18.05.0-ce',
    'Details': {
      'ApiVersion': '1.37',
      'Arch': 'amd64',
      'BuildTime': '2018-05-09T22:20:42.000000000+00:00',
      'Experimental': 'false',
      'GitCommit': 'f150324',
      'GoVersion': 'go1.10.1',
      'KernelVersion': '4.9.93-boot2docker',
      'MinAPIVersion': '1.12',
      'Os': 'linux'
    }
  }],
  'Version': '18.05.0-ce',
  'ApiVersion': '1.37',
  'MinAPIVersion': '1.12',
  'GitCommit': 'f150324',
  'GoVersion': 'go1.10.1',
  'Os': 'linux',
  'Arch': 'amd64',
  'KernelVersion': '4.9.93-boot2docker',
  'BuildTime': '2018-05-09T22:20:42.000000000+00:00'
};

angular.module('portainer.app')
  .factory('VersionInterceptor', ['$q', '$rootScope', function ($q, $rootScope) {
    return {
      request: function (request) {
        console.log('version request');
        return request;
      },
      requestError: function (rejection) {
        console.log('version request error');
        return $q.reject(rejection);
      },
      response: function (response) {
        console.log('version response');
        return response.resource;
      },
      responseError: function (rejection) {
        console.log('version reponse error');

        if (rejection.status === 502) {
          if ($rootScope.endpoints !== undefined) {
            var endpointId = _.split(rejection.config.url, '/')[2];
            endpointId = parseInt(endpointId, 10);
            var endpoint = _.find($rootScope.endpoints, function (item) {
              return item.Id === endpointId;
            });
            var data = g_version; //endpoint.Snapshots[0].SnapshotRaw.Version;
            console.log('endpoint', endpoint, 'data', data);
            if (endpoint !== undefined && data !== undefined) {
              rejection.status = 200;
              rejection.data = data;
              console.log(rejection);
              return data;
            }
          }
        }
        return $q.reject(rejection);
      }
    };
  }]);
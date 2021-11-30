import angular from 'angular';

const API_ENDPOINT_OPEN_AMT = 'api/open_amt';

angular.module('portainer.app').factory('OpenAMT', OpenAMTFactory);

/* @ngInject */
function OpenAMTFactory($resource) {
  return $resource(
    API_ENDPOINT_OPEN_AMT,
    {},
    {
      submit: { method: 'POST' },
    }
  );
}

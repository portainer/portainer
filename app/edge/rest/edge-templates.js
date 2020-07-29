import angular from 'angular';

import { API_ENDPOINT_EDGE_TEMPLATES } from '@/constants';

angular.module('portainer.edge').factory('EdgeTemplates', function EdgeStacksFactory($resource) {
  return $resource(
    API_ENDPOINT_EDGE_TEMPLATES,
    {},
    {
      query: { method: 'GET', isArray: true },
    }
  );
});

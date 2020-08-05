import gitlabResponseGetLink from './transform/gitlabResponseGetLink';

angular.module('portainer.app').factory('Gitlab', [
  '$resource',
  'API_ENDPOINT_REGISTRIES',
  function GitlabFactory($resource, API_ENDPOINT_REGISTRIES) {
    'use strict';
    return function (env) {
      const headers = {};
      if (env) {
        headers['Private-Token'] = env.token;
        headers['X-Gitlab-Domain'] = env.url;
      }

      const baseUrl = API_ENDPOINT_REGISTRIES + '/:id/proxies/gitlab/api/v4/projects';

      return $resource(
        baseUrl,
        { id: '@id' },
        {
          projects: {
            method: 'GET',
            params: { membership: 'true' },
            transformResponse: gitlabResponseGetLink,
            headers: headers,
          },
          repositories: {
            method: 'GET',
            url: baseUrl + '/:projectId/registry/repositories',
            params: { tags: true },
            headers: headers,
            transformResponse: gitlabResponseGetLink,
          },
        }
      );
    };
  },
]);

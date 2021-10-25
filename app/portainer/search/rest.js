import angular from 'angular';

angular.module('portainer.kubernetes').factory('SearchFactory', SearchFactory);

/* @ngInject */
function SearchFactory($resource, API_ENDPOINT_SEARCH) {
  const searchUrl = API_ENDPOINT_SEARCH;

  return $resource(
    searchUrl,
    {},
    {
      search: {
        method: 'GET',
        url: `${searchUrl}`,
        params: { query: '@query' },
      },
    }
  );
}

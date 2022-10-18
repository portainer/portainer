angular.module('portainer.app').factory('Namespaces', [
    '$resource',
    'API_ENDPOINT_NAMESPACES',
    function NamespaceFactory($resource, API_ENDPOINT_NAMESPACES) {
        'use strict';
        return $resource(
            API_ENDPOINT_NAMESPACES + '/:id/:action',
            {},
            {
                get: { method: 'GET', params: { id: '@id' } },
                create: { method: 'POST', ignoreLoadingBar: true },
                query: { method: 'GET', isArray: true },
                containers: { method: 'GET', params: { id: '@id', action:'containers'}},
                remove: { method: 'DELETE', params: { id: '@id' } },
            }
        );
    },
]);

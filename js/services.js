'use strict';
angular.module('dockerui.services', [
    'ngResource'
]).factory('Container', function ($resource, DOCKER_ENDPOINT) {
    return $resource(DOCKER_ENDPOINT + '/containers/:id/:action', {
    }, {
        query: {
            method: 'GET',
            params: {
                all: 0,
                action: 'json'
            },
            isArray: true
        },
        get: {
            method: 'GET',
            params: {
                action: 'json'
            }
        },
        start: {
            method: 'POST',
            params: {
                action: 'start'
            }
        },
        stop: {
            method: 'POST',
            params: {
                t: 5,
                action: 'stop'
            }
        },
        restart: {
            method: 'POST',
            params: {
                t: 5,
                action: 'restart'
            }
        },
        kill: {
            method: 'POST',
            params: {
                action: 'kill'
            }
        },
        changes: {
            method: 'GET',
            params: {
                action: 'chagnes'
            }
        },
        create: {
            method: 'POST',
            params: {
                action: 'create'
            }
        },
        remove: {
            method: 'DELETE',
            params: {
                v: 0
            }
        }
    });
}).factory('Image', function ($resource, DOCKER_ENDPOINT) {
    return $resource(DOCKER_ENDPOINT + '/images/:name/:action', {
    }, {
        query: {
            method: 'GET',
            params: {
                all: 0,
                action: 'json'
            },
            isArray: true
        },
        get: {
            method: 'GET',
            params: {
                action: 'json'
            }
        },
        search: {
            method: 'GET',
            params: {
                action: 'search'
            }
        },
        history: {
            method: 'GET',
            params: {
                action: 'history'
            }
        },
        create: {
            method: 'POST',
            params: {
                action: 'create'
            }
        },
        insert: {
            method: 'POST',
            params: {
                action: 'insert'
            }
        },
        push: {
            method: 'POST',
            params: {
                action: 'push'
            }
        },
        tag: {
            method: 'POST',
            params: {
                action: 'tag'
            }
        },
        delete: {
            method: 'DELETE'
        }
    });
});

'use strict';

angular.module('dockerui.services', ['ngResource'])
    .factory('Container', function($resource, DOCKER_ENDPOINT) {
        // Resource for interacting with the docker containers
        // http://docs.docker.io/en/latest/api/docker_remote_api.html#containers
        return $resource(DOCKER_ENDPOINT + '/containers/:id/:action', {}, {
            query: {method: 'GET', params:{ all: 0, action: 'json'}, isArray: true},
            get :{method: 'GET', params: { action:'json'}},
            start: {method: 'POST', params: {id: '@id', action: 'start'}},
            stop: {method: 'POST', params: {id: '@id', t: 5, action: 'stop'}},
            restart: {method: 'POST', params: {id: '@id', t: 5, action: 'restart' }},
            kill :{method: 'POST', params: {id: '@id', action:'kill'}},
            changes :{method: 'GET', params: {action:'changes'}, isArray: true},
            create :{method: 'POST', params: {action:'create'}},
            remove :{method: 'DELETE', params: {id: '@id', v:0}}
        });
    })
    .factory('Image', function($resource, DOCKER_ENDPOINT) {
        // Resource for docker images
        // http://docs.docker.io/en/latest/api/docker_remote_api.html#images
        return $resource(DOCKER_ENDPOINT + '/images/:id/:action', {}, {
            query: {method: 'GET', params:{ all: 0, action: 'json'}, isArray: true},
            get :{method: 'GET', params: { action:'json'}},
            search :{method: 'GET', params: { action:'search'}},
            history :{method: 'GET', params: { action:'history'}, isArray: true},
            create :{method: 'POST', params: {action:'create'}},
            insert :{method: 'POST', params: {id: '@id', action:'insert'}},
            push :{method: 'POST', params: {id: '@id', action:'push'}},
            tag :{method: 'POST', params: {id: '@id', action:'tag'}},
            delete :{id: '@id', method: 'DELETE'}
        });
    })
    .factory('Docker', function($resource, DOCKER_ENDPOINT) {
        // Information for docker
        // http://docs.docker.io/en/latest/api/docker_remote_api.html#display-system-wide-information
        return $resource(DOCKER_ENDPOINT + '/version', {}, {
            get: {method: 'GET'}
        });
    })
    .factory('Auth', function($resource, DOCKER_ENDPOINT) {
        // Auto Information for docker
        // http://docs.docker.io/en/latest/api/docker_remote_api.html#set-auth-configuration
        return $resource(DOCKER_ENDPOINT + '/auth', {}, {
            get: {method: 'GET'},
            update: {method: 'POST'}
        });
    })
    .factory('System', function($resource, DOCKER_ENDPOINT) {
        // System for docker
        // http://docs.docker.io/en/latest/api/docker_remote_api.html#display-system-wide-information
        return $resource(DOCKER_ENDPOINT + '/info', {}, {
            get: {method: 'GET'}
        });
    })
    .factory('Settings', function() {
        return {
            displayAll: false    
        };    
    });

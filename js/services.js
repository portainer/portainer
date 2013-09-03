'use strict';

angular.module('dockerui.services', ['ngResource'])
    .factory('Container', function($resource, Settings) {
        // Resource for interacting with the docker containers
        // http://docs.docker.io/en/latest/api/docker_remote_api.html#containers
        return $resource(Settings.url + '/containers/:id/:action', {}, {
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
    .factory('Image', function($resource, Settings) {
        // Resource for docker images
        // http://docs.docker.io/en/latest/api/docker_remote_api.html#images
        return $resource(Settings.url + '/images/:id/:action', {}, {
            query: {method: 'GET', params:{ all: 0, action: 'json'}, isArray: true},
            get :{method: 'GET', params: { action:'json'}},
            search :{method: 'GET', params: { action:'search'}},
            history :{method: 'GET', params: { action:'history'}, isArray: true},
            create :{method: 'POST', params: {action:'create'}},
            insert :{method: 'POST', params: {id: '@id', action:'insert'}},
            push :{method: 'POST', params: {id: '@id', action:'push'}},
            tag :{method: 'POST', params: {id: '@id', action:'tag', force: 0, repo: '@repo'}},
            remove :{method: 'DELETE', params: {id: '@id'}, isArray: true}
        });
    })
    .factory('Docker', function($resource, Settings) {
        // Information for docker
        // http://docs.docker.io/en/latest/api/docker_remote_api.html#display-system-wide-information
        return $resource(Settings.url + '/version', {}, {
            get: {method: 'GET'}
        });
    })
    .factory('Auth', function($resource, Settings) {
        // Auto Information for docker
        // http://docs.docker.io/en/latest/api/docker_remote_api.html#set-auth-configuration
        return $resource(Settings.url + '/auth', {}, {
            get: {method: 'GET'},
            update: {method: 'POST'}
        });
    })
    .factory('System', function($resource, Settings) {
        // System for docker
        // http://docs.docker.io/en/latest/api/docker_remote_api.html#display-system-wide-information
        return $resource(Settings.url + '/info', {}, {
            get: {method: 'GET'}
        });
    })
    .factory('Settings', function(DOCKER_ENDPOINT, DOCKER_PORT, DOCKER_API_VERSION, UI_VERSION) {
        var url = DOCKER_ENDPOINT;
        if (DOCKER_PORT) {
            url = url + DOCKER_PORT + '\\' + DOCKER_PORT;
        }
        return {
            displayAll: false,
            endpoint: DOCKER_ENDPOINT,
            version: DOCKER_API_VERSION,
            rawUrl: DOCKER_ENDPOINT + DOCKER_PORT + '/' + DOCKER_API_VERSION,
            uiVersion: UI_VERSION,
            url: url,
            firstLoad: true,
        };
    })
    .factory('ViewSpinner', function() {
        var spinner = new Spinner();
        var target = document.getElementById('view');

       return {
          spin: function() { spinner.spin(target); },
          stop: function() { spinner.stop(); }
       };
    })
    .factory('Messages', function($rootScope) {
        return {
          send: function(title, text) {
              $.gritter.add({
                   title: title,
                   text: text,
                   time: 2000,
                   before_open: function() {
                       if($('.gritter-item-wrapper').length == 3) {
                            return false;
                        }  
                    }

              }); 
           },
           error: function(title, text) {
                $.gritter.add({
                    title: title,
                    text: text,
                    time: 6000,
                    before_open: function() {
                       if($('.gritter-item-wrapper').length == 4) {
                            return false;
                        }  
                    }
                });
           }
        };
    })
    .factory('Dockerfile', function(Settings) {
        var url = Settings.rawUrl  + '/build';
        return {
           build: function(file, callback) {
              var data = new FormData();
              var dockerfile = new Blob([file], { type: 'text/text' });
              data.append('Dockerfile', dockerfile);

              var request = new XMLHttpRequest();
              request.onload = callback;
              request.open('POST', url);
              request.send(data);
           }
        };
    });

angular.module('<%= pkg.name %>.services', ['ngResource'])
    .factory('Container', function($resource, Settings) {
        'use strict';
        // Resource for interacting with the docker containers
        // http://docs.docker.io/en/latest/api/docker_remote_api.html#containers
        return $resource(Settings.url + '/containers/:id/:action', {
            name: '@name'
        }, {
            query: {method: 'GET', params:{ all: 0, action: 'json'}, isArray: true},
            get: {method: 'GET', params: { action:'json'}},
            start: {method: 'POST', params: {id: '@id', action: 'start'}},
            stop: {method: 'POST', params: {id: '@id', t: 5, action: 'stop'}},
            restart: {method: 'POST', params: {id: '@id', t: 5, action: 'restart' }},
            kill: {method: 'POST', params: {id: '@id', action: 'kill'}},
            pause: {method: 'POST', params: {id: '@id', action: 'pause'}},
            unpause: {method: 'POST', params: {id: '@id', action: 'unpause'}},
            changes: {method: 'GET', params: {action:'changes'}, isArray: true},
            create: {method: 'POST', params: {action:'create'}},
            remove: {method: 'DELETE', params: {id: '@id', v:0}}
        });
    })
    .factory('ContainerLogs', function($resource, $http, Settings) {
        'use strict';
        return {
            get: function(id, params, callback) {
                $http({
                    method: 'GET',
                    url: Settings.url + '/containers/'+id+'/logs',
                    params: {'stdout': params.stdout || 0, 'stderr': params.stderr || 0, 'timestamps': params.timestamps || 0, 'tail': params.tail || 'all'}
                }).success(callback).error(function(data, status, headers, config) {
                    console.log(error, data);
                });
            }
        };
    })
    .factory('Image', function($resource, Settings) {
        'use strict';
        // Resource for docker images
        // http://docs.docker.io/en/latest/api/docker_remote_api.html#images
        return $resource(Settings.url + '/images/:id/:action', {}, {
            query: {method: 'GET', params:{ all: 0, action: 'json'}, isArray: true},
            get: {method: 'GET', params: { action:'json'}},
            search: {method: 'GET', params: { action:'search'}},
            history: {method: 'GET', params: { action:'history'}, isArray: true},
            create: {method: 'POST', params: {action:'create'}},
            insert: {method: 'POST', params: {id: '@id', action:'insert'}},
            push: {method: 'POST', params: {id: '@id', action:'push'}},
            tag: {method: 'POST', params: {id: '@id', action:'tag', force: 0, repo: '@repo'}},
            remove: {method: 'DELETE', params: {id: '@id'}, isArray: true}
        });
    })
    .factory('Docker', function($resource, Settings) {
        'use strict';
        // Information for docker
        // http://docs.docker.io/en/latest/api/docker_remote_api.html#display-system-wide-information
        return $resource(Settings.url + '/version', {}, {
            get: {method: 'GET'}
        });
    })
    .factory('Auth', function($resource, Settings) {
        'use strict';
        // Auto Information for docker
        // http://docs.docker.io/en/latest/api/docker_remote_api.html#set-auth-configuration
        return $resource(Settings.url + '/auth', {}, {
            get: {method: 'GET'},
            update: {method: 'POST'}
        });
    })
    .factory('System', function($resource, Settings) {
        'use strict';
        // System for docker
        // http://docs.docker.io/en/latest/api/docker_remote_api.html#display-system-wide-information
        return $resource(Settings.url + '/info', {}, {
            get: {method: 'GET'}
        });
    })
    .factory('Settings', function(DOCKER_ENDPOINT, DOCKER_PORT, DOCKER_API_VERSION, UI_VERSION) {
        'use strict';
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
            firstLoad: true
        };
    })
    .factory('ViewSpinner', function() {
        'use strict';
        var spinner = new Spinner();
        var target = document.getElementById('view');

        return {
            spin: function() { spinner.spin(target); },
            stop: function() { spinner.stop(); }
        };
    })
    .factory('Messages', function($rootScope) {
        'use strict';
        return {
            send: function(title, text) {
                $.gritter.add({
                    title: title,
                    text: text,
                    time: 2000,
                    before_open: function() {
                        if($('.gritter-item-wrapper').length === 3) {
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
                        if($('.gritter-item-wrapper').length === 4) {
                            return false;
                        }  
                    }
                });
            }
        };
    })
    .factory('Dockerfile', function(Settings) {
        'use strict';
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
    })
    .factory('LineChart', function(Settings) {
        'use strict';
        var url = Settings.rawUrl  + '/build';
        return {
            build: function(id, data, getkey){
                var chart = new Chart($(id).get(0).getContext("2d"));
                var map = {};

                for (var i = 0; i < data.length; i++) {
                    var c = data[i];
                    var key = getkey(c);
                    
                    var count = map[key];
                    if (count === undefined) {
                        count = 0;
                    }
                    count += 1;
                    map[key] = count;
                }

                var labels = [];
                data = [];
                var keys = Object.keys(map);

                for (i = keys.length - 1; i > -1; i--) {
                    var k = keys[i];
                    labels.push(k);
                    data.push(map[k]);
                }
                var dataset = {
                    fillColor : "rgba(151,187,205,0.5)",
                    strokeColor : "rgba(151,187,205,1)",
                    pointColor : "rgba(151,187,205,1)",
                    pointStrokeColor : "#fff",
                    data : data
                };
                chart.Line({
                    labels: labels,
                    datasets: [dataset]
                }, 
                {
                    scaleStepWidth: 1, 
                    pointDotRadius:1,
                    scaleOverride: true,
                    scaleSteps: labels.length
                });
            }
        };
    });

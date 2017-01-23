angular.module('portainer.services', ['ngResource', 'ngSanitize'])
    .factory('Container', ['$resource', 'Settings', function ContainerFactory($resource, Settings) {
        'use strict';
        // Resource for interacting with the docker containers
        // http://docs.docker.com/reference/api/docker_remote_api_<%= remoteApiVersion %>/#2-1-containers
        return $resource(Settings.url + '/containers/:id/:action', {
            name: '@name'
        }, {
            query: {method: 'GET', params: {all: 0, action: 'json', filters: '@filters' }, isArray: true},
            get: {method: 'GET', params: {action: 'json'}},
            stop: {method: 'POST', params: {id: '@id', t: 5, action: 'stop'}},
            restart: {method: 'POST', params: {id: '@id', t: 5, action: 'restart'}},
            kill: {method: 'POST', params: {id: '@id', action: 'kill'}},
            pause: {method: 'POST', params: {id: '@id', action: 'pause'}},
            unpause: {method: 'POST', params: {id: '@id', action: 'unpause'}},
            changes: {method: 'GET', params: {action: 'changes'}, isArray: true},
            stats: {method: 'GET', params: {id: '@id', stream: false, action: 'stats'}, timeout: 5000},
            start: {
              method: 'POST', params: {id: '@id', action: 'start'},
              transformResponse: genericHandler
            },
            create: {
              method: 'POST', params: {action: 'create'},
              transformResponse: genericHandler
            },
            remove: {
              method: 'DELETE', params: {id: '@id', v: 0},
              transformResponse: genericHandler
            },
            rename: {
              method: 'POST', params: {id: '@id', action: 'rename', name: '@name'},
              transformResponse: genericHandler
            },
            exec: {
              method: 'POST', params: {id: '@id', action: 'exec'},
              transformResponse: genericHandler
            }
        });
    }])
    .factory('Service', ['$resource', 'Settings', function ServiceFactory($resource, Settings) {
      'use strict';
      // https://docs.docker.com/engine/reference/api/docker_remote_api_<%= remoteApiVersion %>/#/3-9-services
      return $resource(Settings.url + '/services/:id/:action', {}, {
        get: { method: 'GET', params: {id: '@id'} },
        query: { method: 'GET', isArray: true },
        create: { method: 'POST', params: {action: 'create'} },
        update: { method: 'POST', params: {id: '@id', action: 'update', version: '@version'} },
        remove: { method: 'DELETE', params: {id: '@id'} }
      });
    }])
    .factory('Task', ['$resource', 'Settings', function TaskFactory($resource, Settings) {
      'use strict';
      // https://docs.docker.com/engine/reference/api/docker_remote_api_<%= remoteApiVersion %>/#/3-9-services
      return $resource(Settings.url + '/tasks/:id', {}, {
        get: { method: 'GET', params: {id: '@id'} },
        query: { method: 'GET', isArray: true, params: {filters: '@filters'} }
      });
    }])
    .factory('Exec', ['$resource', 'Settings', function ExecFactory($resource, Settings) {
      'use strict';
      // https://docs.docker.com/engine/reference/api/docker_remote_api_<%= remoteApiVersion %>/#/exec-resize
      return $resource(Settings.url + '/exec/:id/:action', {}, {
        resize: {
          method: 'POST', params: {id: '@id', action: 'resize', h: '@height', w: '@width'},
          transformResponse: genericHandler
        }
      });
    }])
    .factory('ContainerCommit', ['$resource', '$http', 'Settings', function ContainerCommitFactory($resource, $http, Settings) {
        'use strict';
        // http://docs.docker.com/reference/api/docker_remote_api_<%= remoteApiVersion %>/#create-a-new-image-from-a-container-s-changes
        return $resource(Settings.url + '/commit', {}, {
          commit: {method: 'POST', params: {container: '@id', repo: '@repo', tag: '@tag'}}
        });
    }])
    .factory('ContainerLogs', ['$resource', '$http', 'Settings', function ContainerLogsFactory($resource, $http, Settings) {
        'use strict';
        // http://docs.docker.com/reference/api/docker_remote_api_<%= remoteApiVersion %>/#get-container-logs
        return {
            get: function (id, params, callback) {
                $http({
                    method: 'GET',
                    url: Settings.url + '/containers/' + id + '/logs',
                    params: {
                        'stdout': params.stdout || 0,
                        'stderr': params.stderr || 0,
                        'timestamps': params.timestamps || 0,
                        'tail': params.tail || 'all'
                    }
                }).success(callback).error(function (data, status, headers, config) {
                    console.log(error, data);
                });
            }
        };
    }])
    .factory('ContainerTop', ['$http', 'Settings', function ($http, Settings) {
        'use strict';
        // http://docs.docker.com/reference/api/docker_remote_api_<%= remoteApiVersion %>/#list-processes-running-inside-a-container
        return {
            get: function (id, params, callback, errorCallback) {
                $http({
                    method: 'GET',
                    url: Settings.url + '/containers/' + id + '/top',
                    params: {
                        ps_args: params.ps_args
                    }
                }).success(callback);
            }
        };
    }])
    .factory('Image', ['$resource', 'Settings', function ImageFactory($resource, Settings) {
        'use strict';
        // http://docs.docker.com/reference/api/docker_remote_api_<%= remoteApiVersion %>/#2-2-images
        return $resource(Settings.url + '/images/:id/:action', {}, {
            query: {method: 'GET', params: {all: 0, action: 'json'}, isArray: true},
            get: {method: 'GET', params: {action: 'json'}},
            search: {method: 'GET', params: {action: 'search'}},
            history: {method: 'GET', params: {action: 'history'}, isArray: true},
            insert: {method: 'POST', params: {id: '@id', action: 'insert'}},
            tag: {method: 'POST', params: {id: '@id', action: 'tag', force: 0, repo: '@repo', tag: '@tag'}},
            inspect: {method: 'GET', params: {id: '@id', action: 'json'}},
            push: {
                method: 'POST', params: {action: 'push', id: '@tag'},
                isArray: true, transformResponse: jsonObjectsToArrayHandler
            },
            create: {
                method: 'POST', params: {action: 'create', fromImage: '@fromImage', tag: '@tag'},
                isArray: true, transformResponse: jsonObjectsToArrayHandler
            },
            remove: {
              method: 'DELETE', params: {id: '@id'},
              isArray: true, transformResponse: deleteImageHandler
            }
        });
    }])
    .factory('Events', ['$resource', 'Settings', function EventFactory($resource, Settings) {
        'use strict';
        // http://docs.docker.com/reference/api/docker_remote_api_<%= remoteApiVersion %>/#/monitor-docker-s-events
        return $resource(Settings.url + '/events', {}, {
            query: {
              method: 'GET', params: {since: '@since', until: '@until'},
              isArray: true, transformResponse: jsonObjectsToArrayHandler
            }
        });
    }])
    .factory('Version', ['$resource', 'Settings', function VersionFactory($resource, Settings) {
        'use strict';
        // http://docs.docker.com/reference/api/docker_remote_api_<%= remoteApiVersion %>/#show-the-docker-version-information
        return $resource(Settings.url + '/version', {}, {
            get: {method: 'GET'}
        });
    }])
    .factory('Node', ['$resource', 'Settings', function NodeFactory($resource, Settings) {
        'use strict';
        // https://docs.docker.com/engine/reference/api/docker_remote_api_<%= remoteApiVersion %>/#/3-7-nodes
        return $resource(Settings.url + '/nodes', {}, {
          query: {
            method: 'GET', isArray: true
          }
        });
    }])
    .factory('Swarm', ['$resource', 'Settings', function SwarmFactory($resource, Settings) {
        'use strict';
        // https://docs.docker.com/engine/reference/api/docker_remote_api_<%= remoteApiVersion %>/#/3-8-swarm
        return $resource(Settings.url + '/swarm', {}, {
            get: {method: 'GET'}
        });
    }])
    .factory('Info', ['$resource', 'Settings', function InfoFactory($resource, Settings) {
        'use strict';
        // http://docs.docker.com/reference/api/docker_remote_api_<%= remoteApiVersion %>/#display-system-wide-information
        return $resource(Settings.url + '/info', {}, {
            get: {method: 'GET'}
        });
    }])
    .factory('Network', ['$resource', 'Settings', function NetworkFactory($resource, Settings) {
        'use strict';
        // http://docs.docker.com/reference/api/docker_remote_api_<%= remoteApiVersion %>/#2-5-networks
        return $resource(Settings.url + '/networks/:id/:action', {id: '@id'}, {
            query: {method: 'GET', isArray: true},
            get: {method: 'GET'},
            create: {method: 'POST', params: {action: 'create'}, transformResponse: genericHandler},
            remove: { method: 'DELETE', transformResponse: genericHandler },
            connect: {method: 'POST', params: {action: 'connect'}},
            disconnect: {method: 'POST', params: {action: 'disconnect'}}
        });
    }])
    .factory('Volume', ['$resource', 'Settings', function VolumeFactory($resource, Settings) {
        'use strict';
        // http://docs.docker.com/reference/api/docker_remote_api_<%= remoteApiVersion %>/#2-5-networks
        return $resource(Settings.url + '/volumes/:name/:action', {name: '@name'}, {
          query: {method: 'GET'},
          get: {method: 'GET'},
          create: {method: 'POST', params: {action: 'create'}, transformResponse: genericHandler},
          remove: {
            method: 'DELETE', transformResponse: genericHandler
          }
        });
    }])
    .factory('Config', ['$resource', 'CONFIG_ENDPOINT', function ConfigFactory($resource, CONFIG_ENDPOINT) {
      return $resource(CONFIG_ENDPOINT).get();
    }])
    .factory('Templates', ['$resource', 'TEMPLATES_ENDPOINT', function TemplatesFactory($resource, TEMPLATES_ENDPOINT) {
      return $resource(TEMPLATES_ENDPOINT, {}, {
        get: {method: 'GET', isArray: true}
      });
    }])
    .factory('Settings', ['DOCKER_ENDPOINT', 'DOCKER_PORT', 'UI_VERSION', 'PAGINATION_MAX_ITEMS', function SettingsFactory(DOCKER_ENDPOINT, DOCKER_PORT, UI_VERSION, PAGINATION_MAX_ITEMS) {
        'use strict';
        var url = DOCKER_ENDPOINT;
        if (DOCKER_PORT) {
            url = url + DOCKER_PORT + '\\' + DOCKER_PORT;
        }
        var firstLoad = (localStorage.getItem('firstLoad') || 'true') === 'true';
        return {
          displayAll: true,
          endpoint: DOCKER_ENDPOINT,
          uiVersion: UI_VERSION,
          url: url,
          firstLoad: firstLoad,
          pagination_count: PAGINATION_MAX_ITEMS
        };
    }])
    .factory('Auth', ['$resource', 'AUTH_ENDPOINT', function AuthFactory($resource, AUTH_ENDPOINT) {
      'use strict';
      return $resource(AUTH_ENDPOINT, {}, {
        login: {
          method: 'POST'
        }
      });
    }])
    .factory('Users', ['$resource', 'USERS_ENDPOINT', function UsersFactory($resource, USERS_ENDPOINT) {
      'use strict';
      return $resource(USERS_ENDPOINT + '/:username/:action', {}, {
        create: { method: 'POST' },
        get: { method: 'GET', params: { username: '@username' } },
        update: { method: 'PUT', params: { username: '@username' } },
        checkPassword: { method: 'POST', params: { username: '@username', action: 'passwd' } },
        checkAdminUser: { method: 'GET', params: { username: 'admin', action: 'check' } },
        initAdminUser: { method: 'POST', params: { username: 'admin', action: 'init' } }
      });
    }])
    .factory('Authentication', ['$q', '$rootScope', 'Auth', 'jwtHelper', 'LocalStorage', 'StateManager', function AuthenticationFactory($q, $rootScope, Auth, jwtHelper, LocalStorage, StateManager) {
      'use strict';
      return {
        init: function() {
          var jwt = LocalStorage.getJWT();
          if (jwt) {
            var tokenPayload = jwtHelper.decodeToken(jwt);
            $rootScope.username = tokenPayload.username;
          }
        },
        login: function(username, password) {
          return $q(function (resolve, reject) {
            Auth.login({username: username, password: password}).$promise
            .then(function(data) {
              LocalStorage.storeJWT(data.jwt);
              $rootScope.username = username;
              resolve();
            }, function() {
              reject();
            });
          });
        },
        logout: function() {
          StateManager.clean();
          LocalStorage.clean();
        },
        isAuthenticated: function() {
          var jwt = LocalStorage.getJWT();
          return jwt && !jwtHelper.isTokenExpired(jwt);
        }
      };
    }])
    .factory('FileUploadService', ['$q', 'Upload', function FileUploadFactory($q, Upload) {
      'use strict';
      function uploadFile(url, file) {
        var deferred = $q.defer();
        Upload.upload({
          url: url,
          data: { file: file }
        }).then(function success(data) {
          deferred.resolve(data);
        }, function error(e) {
          deferred.reject(e);
        }, function progress(evt) {
        });
        return deferred.promise;
      }
      return {
        uploadTLSFilesForEndpoint: function(endpointID, TLSCAFile, TLSCertFile, TLSKeyFile) {
          var deferred = $q.defer();
          var queue = [];

          if (TLSCAFile !== null) {
            var uploadTLSCA = uploadFile('api/upload/tls/' + endpointID + '/ca', TLSCAFile);
            queue.push(uploadTLSCA);
          }
          if (TLSCertFile !== null) {
            var uploadTLSCert = uploadFile('api/upload/tls/' + endpointID + '/cert', TLSCertFile);
            queue.push(uploadTLSCert);
          }
          if (TLSKeyFile !== null) {
            var uploadTLSKey = uploadFile('api/upload/tls/' + endpointID + '/key', TLSKeyFile);
            queue.push(uploadTLSKey);
          }
          $q.all(queue).then(function (data) {
            deferred.resolve(data);
          }, function (err) {
            deferred.reject(err);
          }, function update(evt) {
            deferred.notify(evt);
          });
          return deferred.promise;
        }
      };
    }])
    .factory('Endpoints', ['$resource', 'ENDPOINTS_ENDPOINT', function EndpointsFactory($resource, ENDPOINTS_ENDPOINT) {
      'use strict';
      return $resource(ENDPOINTS_ENDPOINT + '/:id/:action', {}, {
        create: { method: 'POST' },
        query: { method: 'GET', isArray: true },
        get: { method: 'GET', params: { id: '@id' } },
        update: { method: 'PUT', params: { id: '@id' } },
        remove: { method: 'DELETE', params: { id: '@id'} },
        getActiveEndpoint: { method: 'GET', params: { id: '0' } },
        setActiveEndpoint: { method: 'POST', params: { id: '@id', action: 'active' } }
      });
    }])
    .factory('Pagination', ['LocalStorage', 'Settings', function PaginationFactory(LocalStorage, Settings) {
      'use strict';
      return {
        getPaginationCount: function(key) {
          var storedCount = LocalStorage.getPaginationCount(key);
          var paginationCount = Settings.pagination_count;
          if (storedCount !== null) {
            paginationCount = storedCount;
          }
          return '' + paginationCount;
        },
        setPaginationCount: function(key, count) {
          LocalStorage.storePaginationCount(key, count);
        }
      };
    }])
    .factory('LocalStorage', ['localStorageService', function LocalStorageFactory(localStorageService) {
      'use strict';
      return {
        storeEndpointState: function(state) {
          localStorageService.set('ENDPOINT_STATE', state);
        },
        getEndpointState: function() {
          return localStorageService.get('ENDPOINT_STATE');
        },
        storeJWT: function(jwt) {
          localStorageService.set('JWT', jwt);
        },
        getJWT: function() {
          return localStorageService.get('JWT');
        },
        deleteJWT: function() {
          localStorageService.remove('JWT');
        },
        storePaginationCount: function(key, count) {
          localStorageService.cookie.set('pagination_' + key, count);
        },
        getPaginationCount: function(key) {
          return localStorageService.cookie.get('pagination_' + key);
        },
        clean: function() {
          localStorageService.clearAll();
        }
      };
    }])
    .factory('StateManager', ['$q', 'Info', 'InfoHelper', 'Version', 'LocalStorage', function StateManagerFactory($q, Info, InfoHelper, Version, LocalStorage) {
      'use strict';

      var state = {
        loading: true,
        application: {},
        endpoint: {}
      };

      return {
        init: function() {
          var endpointState = LocalStorage.getEndpointState();
          if (endpointState) {
            state.endpoint = endpointState;
          }
          state.loading = false;
        },
        clean: function() {
          state.endpoint = {};
        },
        updateEndpointState: function(loading) {
          var deferred = $q.defer();
          if (loading) {
            state.loading = true;
          }
          $q.all([Info.get({}).$promise, Version.get({}).$promise])
          .then(function success(data) {
            var endpointMode = InfoHelper.determineEndpointMode(data[0]);
            var endpointAPIVersion = parseFloat(data[1].ApiVersion);
            state.endpoint.mode = endpointMode;
            state.endpoint.apiVersion = endpointAPIVersion;
            LocalStorage.storeEndpointState(state.endpoint);
            state.loading = false;
            deferred.resolve();
          }, function error(err) {
            state.loading = false;
            deferred.reject({msg: 'Unable to connect to the Docker endpoint', err: err});
          });
          return deferred.promise;
        },
        getState: function() {
          return state;
        }
      };
    }])
    .factory('EndpointService', ['$q', 'Endpoints', 'FileUploadService', function EndpointServiceFactory($q, Endpoints, FileUploadService) {
      'use strict';
      return {
        getActive: function() {
          return Endpoints.getActiveEndpoint().$promise;
        },
        setActive: function(endpointID) {
          return Endpoints.setActiveEndpoint({id: endpointID}).$promise;
        },
        endpoint: function(endpointID) {
          return Endpoints.get({id: endpointID}).$promise;
        },
        endpoints: function() {
          return Endpoints.query({}).$promise;
        },
        updateEndpoint: function(ID, name, URL, TLS, TLSCAFile, TLSCertFile, TLSKeyFile, type) {
          var endpoint = {
            id: ID,
            Name: name,
            URL: type === 'local' ? ("unix://" + URL) : ("tcp://" + URL),
            TLS: TLS
          };
          var deferred = $q.defer();
          Endpoints.update({}, endpoint, function success(data) {
            FileUploadService.uploadTLSFilesForEndpoint(ID, TLSCAFile, TLSCertFile, TLSKeyFile).then(function success(data) {
              deferred.notify({upload: false});
              deferred.resolve(data);
            }, function error(err) {
              deferred.notify({upload: false});
              deferred.reject({msg: 'Unable to upload TLS certs', err: err});
            });
          }, function error(err) {
            deferred.reject({msg: 'Unable to update endpoint', err: err});
          });
          return deferred.promise;
        },
        deleteEndpoint: function(endpointID) {
          return Endpoints.remove({id: endpointID}).$promise;
        },
        createLocalEndpoint: function(name, URL, TLS, active) {
          var endpoint = {
            Name: "local",
            URL: "unix:///var/run/docker.sock",
            TLS: false
          };
          return Endpoints.create({active: active}, endpoint).$promise;
        },
        createRemoteEndpoint: function(name, URL, TLS, TLSCAFile, TLSCertFile, TLSKeyFile, active) {
          var endpoint = {
            Name: name,
            URL: 'tcp://' + URL,
            TLS: TLS
          };
          var deferred = $q.defer();
          Endpoints.create({active: active}, endpoint, function success(data) {
            var endpointID = data.Id;
            if (TLS) {
              deferred.notify({upload: true});
              FileUploadService.uploadTLSFilesForEndpoint(endpointID, TLSCAFile, TLSCertFile, TLSKeyFile).then(function success(data) {
                deferred.notify({upload: false});
                if (active) {
                  Endpoints.setActiveEndpoint({}, {id: endpointID}, function success(data) {
                    deferred.resolve(data);
                  }, function error(err) {
                    deferred.reject({msg: 'Unable to create endpoint', err: err});
                  });
                } else {
                  deferred.resolve(data);
                }
              }, function error(err) {
                deferred.notify({upload: false});
                deferred.reject({msg: 'Unable to upload TLS certs', err: err});
              });
            } else {
              deferred.resolve(data);
            }
          }, function error(err) {
            deferred.reject({msg: 'Unable to create endpoint', err: err});
          });
          return deferred.promise;
        }
      };
    }])
    .factory('Messages', ['$rootScope', '$sanitize', function MessagesFactory($rootScope, $sanitize) {
        'use strict';
        return {
            send: function (title, text) {
                $.gritter.add({
                    title: $sanitize(title),
                    text: $sanitize(text),
                    time: 2000,
                    before_open: function () {
                        if ($('.gritter-item-wrapper').length === 3) {
                            return false;
                        }
                    }
                });
            },
            error: function (title, e, fallbackText) {
                var msg = fallbackText;
                if (e.data && e.data.message) {
                  msg = e.data.message;
                } else if (e.message) {
                  msg = e.message;
                } else if (e.data && e.data.length > 0 && e.data[0].message) {
                  msg = e.data[0].message;
                }
                $.gritter.add({
                    title: $sanitize(title),
                    text: $sanitize(msg),
                    time: 10000,
                    before_open: function () {
                        if ($('.gritter-item-wrapper').length === 4) {
                            return false;
                        }
                    }
                });
            }
        };
    }])
    .factory('LineChart', ['Settings', function LineChartFactory(Settings) {
        'use strict';
        return {
            build: function (id, data, getkey) {
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
                var max = 1;

                for (i = keys.length - 1; i > -1; i--) {
                    var k = keys[i];
                    labels.push(k);
                    data.push(map[k]);
                    if (map[k] > max) {
                        max = map[k];
                    }
                }
                var steps = Math.min(max, 10);
                var dataset = {
                    fillColor: "rgba(151,187,205,0.5)",
                    strokeColor: "rgba(151,187,205,1)",
                    pointColor: "rgba(151,187,205,1)",
                    pointStrokeColor: "#fff",
                    data: data
                };
                chart.Line({
                        labels: labels,
                        datasets: [dataset]
                    },
                    {
                        scaleStepWidth: Math.ceil(max / steps),
                        pointDotRadius: 1,
                        scaleIntegersOnly: true,
                        scaleOverride: true,
                        scaleSteps: steps
                    });
            }
        };
    }]);

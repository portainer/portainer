/*! uifordocker - v0.10.1-beta - 2016-05-25
 * https://github.com/kevana/ui-for-docker
 * Copyright (c) 2016 Michael Crosby & Kevan Ahlquist;
 * Licensed MIT
 */
angular.module('uifordocker', [
    'uifordocker.templates',
    'ui.bootstrap',
    'ui.router',
    'ngCookies',
    'ngRoute',
    'dockerui.services',
    'dockerui.filters',
    'masthead',
    'footer',
    'dashboard',
    'container',
    'containers',
    'images',
    'image',
    'pullImage',
    'startContainer',
    'sidebar',
    'info',
    'builder',
    'containerLogs',
    'containerTop',
    'events',
    'stats',
    'swarm',
    'network',
    'networks',
    'volumes'])
    .config(['$stateProvider', '$urlRouterProvider', '$httpProvider', function ($stateProvider, $urlRouterProvider, $httpProvider) {
        'use strict';

        $httpProvider.defaults.xsrfCookieName = 'csrfToken';
        $httpProvider.defaults.xsrfHeaderName = 'X-CSRF-Token';

        $urlRouterProvider.otherwise('/');

        $stateProvider
        .state('index', {
          url: '/',
          templateUrl: 'app/components/dashboard/dashboard.html',
          controller: 'DashboardController'
        })
        .state('containers', {
          url: '/containers/',
          templateUrl: 'app/components/containers/containers.html',
          controller: 'ContainersController'
        })
        .state('images', {
          url: '/images/',
          templateUrl: 'app/components/images/images.html',
          controller: 'ImagesController'
        })
        .state('networks', {
          url: '/networks/',
          templateUrl: 'app/components/networks/networks.html',
          controller: 'NetworksController'
        })
        .state('volumes', {
          url: '/volumes/',
          templateUrl: 'app/components/volumes/volumes.html',
          controller: 'VolumesController'
        })
        .state('swarm', {
          url: '/swarm/',
          templateUrl: 'app/components/swarm/swarm.html',
          controller: 'SwarmController'
        });

        // $routeProvider.when('/containers/', {
        //     templateUrl: 'app/components/containers/containers.html',
        //     controller: 'ContainersController'
        // });
        // $routeProvider.when('/containers/:id/', {
        //     templateUrl: 'app/components/container/container.html',
        //     controller: 'ContainerController'
        // });
        // $routeProvider.when('/containers/:id/logs/', {
        //     templateUrl: 'app/components/containerLogs/containerlogs.html',
        //     controller: 'ContainerLogsController'
        // });
        // $routeProvider.when('/containers/:id/top', {
        //     templateUrl: 'app/components/containerTop/containerTop.html',
        //     controller: 'ContainerTopController'
        // });
        // $routeProvider.when('/containers/:id/stats', {
        //     templateUrl: 'app/components/stats/stats.html',
        //     controller: 'StatsController'
        // });
        // $routeProvider.when('/images/', {
        //     templateUrl: 'app/components/images/images.html',
        //     controller: 'ImagesController'
        // });
        // $routeProvider.when('/images/:id*/', {
        //     templateUrl: 'app/components/image/image.html',
        //     controller: 'ImageController'
        // });
        // $routeProvider.when('/info', {templateUrl: 'app/components/info/info.html', controller: 'InfoController'});
        // $routeProvider.when('/events', {
        //     templateUrl: 'app/components/events/events.html',
        //     controller: 'EventsController'
        // });
        // $routeProvider.otherwise({redirectTo: '/'});

        // The Docker API likes to return plaintext errors, this catches them and disp
        $httpProvider.interceptors.push(function() {
            return {
                'response': function(response) {
                    if (typeof(response.data) === 'string' && response.data.startsWith('Conflict.')) {
                        $.gritter.add({
                            title: 'Error',
                            text: $('<div>').text(response.data).html(),
                            time: 10000
                        });
                    }
                    var csrfToken = response.headers('X-Csrf-Token');
                    if (csrfToken) {
                        document.cookie = 'csrfToken=' + csrfToken;
                    }
                    return response;
                }
            };
        });
    }])
    // This is your docker url that the api will use to make requests
    // You need to set this to the api endpoint without the port i.e. http://192.168.1.9
    .constant('DOCKER_ENDPOINT', 'dockerapi')
    .constant('DOCKER_PORT', '') // Docker port, leave as an empty string if no port is requred.  If you have a port, prefix it with a ':' i.e. :4243
    .constant('UI_VERSION', 'v0.11.0');

angular.module('builder', [])
    .controller('BuilderController', ['$scope',
        function ($scope) {
            $scope.template = 'app/components/builder/builder.html';
        }]);

    angular.module('container', [])
    .controller('ContainerController', ['$scope', '$routeParams', '$location', 'Container', 'ContainerCommit', 'Image', 'Messages', 'ViewSpinner', '$timeout',
        function ($scope, $routeParams, $location, Container, ContainerCommit, Image, Messages, ViewSpinner, $timeout) {
            $scope.changes = [];
            $scope.editEnv = false;
            $scope.editPorts = false;
            $scope.editBinds = false;
            $scope.newCfg = {
                Env: [],
                Ports: {}
            };

            var update = function () {
                ViewSpinner.spin();
                Container.get({id: $routeParams.id}, function (d) {
                    $scope.container = d;
                    $scope.container.edit = false;
                    $scope.container.newContainerName = d.Name;

                    // fill up env
                    if (d.Config.Env) {
                        $scope.newCfg.Env = d.Config.Env.map(function (entry) {
                            return {name: entry.split('=')[0], value: entry.split('=')[1]};
                        });
                    }

                    // fill up ports
                    $scope.newCfg.Ports = {};
                    angular.forEach(d.Config.ExposedPorts, function(i, port) {
                        if (d.HostConfig.PortBindings && port in d.HostConfig.PortBindings) {
                            $scope.newCfg.Ports[port] = d.HostConfig.PortBindings[port];
                        }
                        else {
                            $scope.newCfg.Ports[port] = [];
                        }
                    });

                    // fill up bindings
                    $scope.newCfg.Binds = [];
                    var defaultBinds = {};
                    angular.forEach(d.Config.Volumes, function(value, vol) {
                        defaultBinds[vol] = { ContPath: vol, HostPath: '', ReadOnly: false, DefaultBind: true };
                    });
                    angular.forEach(d.HostConfig.Binds, function(binding, i) {
                        var mountpoint = binding.split(':')[0];
                        var vol = binding.split(':')[1] || '';
                        var ro = binding.split(':').length > 2 && binding.split(':')[2] === 'ro';
                        var defaultBind = false;
                        if (vol === '') {
                            vol = mountpoint;
                            mountpoint = '';
                        }

                        if (vol in defaultBinds) {
                            delete defaultBinds[vol];
                            defaultBind = true;
                        }
                        $scope.newCfg.Binds.push({ ContPath: vol, HostPath: mountpoint, ReadOnly: ro, DefaultBind: defaultBind });
                    });
                    angular.forEach(defaultBinds, function(bind) {
                        $scope.newCfg.Binds.push(bind);
                    });

                    ViewSpinner.stop();
                }, function (e) {
                    if (e.status === 404) {
                        $('.detail').hide();
                        Messages.error("Not found", "Container not found.");
                    } else {
                        Messages.error("Failure", e.data);
                    }
                    ViewSpinner.stop();
                });

            };

            $scope.start = function () {
                ViewSpinner.spin();
                Container.start({
                    id: $scope.container.Id,
                    HostConfig: $scope.container.HostConfig
                }, function (d) {
                    update();
                    Messages.send("Container started", $routeParams.id);
                }, function (e) {
                    update();
                    Messages.error("Failure", "Container failed to start." + e.data);
                });
            };

            $scope.stop = function () {
                ViewSpinner.spin();
                Container.stop({id: $routeParams.id}, function (d) {
                    update();
                    Messages.send("Container stopped", $routeParams.id);
                }, function (e) {
                    update();
                    Messages.error("Failure", "Container failed to stop." + e.data);
                });
            };

            $scope.kill = function () {
                ViewSpinner.spin();
                Container.kill({id: $routeParams.id}, function (d) {
                    update();
                    Messages.send("Container killed", $routeParams.id);
                }, function (e) {
                    update();
                    Messages.error("Failure", "Container failed to die." + e.data);
                });
            };

            $scope.restartEnv = function () {
                var config = angular.copy($scope.container.Config);

                config.Env = $scope.newCfg.Env.map(function(entry) {
                    return entry.name+"="+entry.value;
                });

                var portBindings = angular.copy($scope.newCfg.Ports);
                angular.forEach(portBindings, function(item, key) {
                    if (item.length === 0) {
                        delete portBindings[key];
                    }
                });


                var binds = [];
                angular.forEach($scope.newCfg.Binds, function(b) {
                    if (b.ContPath !== '') {
                        var bindLine = '';
                        if (b.HostPath !== '') {
                            bindLine = b.HostPath + ':';
                        }
                        bindLine += b.ContPath;
                        if (b.ReadOnly) {
                            bindLine += ':ro';
                        }
                        if (b.HostPath !== '' || !b.DefaultBind) {
                            binds.push(bindLine);
                        }
                    }
                });


                ViewSpinner.spin();
                ContainerCommit.commit({id: $routeParams.id, tag: $scope.container.Config.Image, config: config }, function (d) {
                    if ('Id' in d) {
                        var imageId = d.Id;
                        Image.inspect({id: imageId}, function(imageData) {
                            // Append current host config to image with new port bindings
                            imageData.Config.HostConfig = angular.copy($scope.container.HostConfig);
                            imageData.Config.HostConfig.PortBindings = portBindings;
                            imageData.Config.HostConfig.Binds = binds;
                            if (imageData.Config.HostConfig.NetworkMode === 'host') {
                                imageData.Config.Hostname = '';
                            }

                            Container.create(imageData.Config, function(containerData) {
                                if (!('Id' in containerData)) {
                                    Messages.error("Failure", "Container failed to create.");
                                    return;
                                }
                                // Stop current if running
                                if ($scope.container.State.Running) {
                                    Container.stop({id: $routeParams.id}, function (d) {
                                        Messages.send("Container stopped", $routeParams.id);
                                        // start new
                                        Container.start({
                                            id: containerData.Id
                                        }, function (d) {
                                            $location.url('/containers/' + containerData.Id + '/');
                                            Messages.send("Container started", $routeParams.id);
                                        }, function (e) {
                                            update();
                                            Messages.error("Failure", "Container failed to start." + e.data);
                                        });
                                    }, function (e) {
                                        update();
                                        Messages.error("Failure", "Container failed to stop." + e.data);
                                    });
                                } else {
                                    // start new
                                    Container.start({
                                        id: containerData.Id
                                    }, function (d) {
                                        $location.url('/containers/'+containerData.Id+'/');
                                        Messages.send("Container started", $routeParams.id);
                                    }, function (e) {
                                        update();
                                        Messages.error("Failure", "Container failed to start." + e.data);
                                    });
                                }

                            }, function(e) {
                                update();
                                Messages.error("Failure", "Image failed to get." + e.data);
                            });
                        }, function (e) {
                            update();
                            Messages.error("Failure", "Image failed to get." + e.data);
                        });

                    } else {
                        update();
                        Messages.error("Failure", "Container commit failed.");
                    }


                }, function (e) {
                    update();
                    Messages.error("Failure", "Container failed to commit." + e.data);
                });
            };

            $scope.commit = function () {
                ViewSpinner.spin();
                ContainerCommit.commit({id: $routeParams.id, repo: $scope.container.Config.Image}, function (d) {
                    update();
                    Messages.send("Container commited", $routeParams.id);
                }, function (e) {
                    update();
                    Messages.error("Failure", "Container failed to commit." + e.data);
                });
            };
            $scope.pause = function () {
                ViewSpinner.spin();
                Container.pause({id: $routeParams.id}, function (d) {
                    update();
                    Messages.send("Container paused", $routeParams.id);
                }, function (e) {
                    update();
                    Messages.error("Failure", "Container failed to pause." + e.data);
                });
            };

            $scope.unpause = function () {
                ViewSpinner.spin();
                Container.unpause({id: $routeParams.id}, function (d) {
                    update();
                    Messages.send("Container unpaused", $routeParams.id);
                }, function (e) {
                    update();
                    Messages.error("Failure", "Container failed to unpause." + e.data);
                });
            };

            $scope.remove = function () {
                ViewSpinner.spin();
                Container.remove({id: $routeParams.id}, function (d) {
                    update();
                    $location.path('/containers');
                    Messages.send("Container removed", $routeParams.id);
                }, function (e) {
                    update();
                    Messages.error("Failure", "Container failed to remove." + e.data);
                });
            };

            $scope.restart = function () {
                ViewSpinner.spin();
                Container.restart({id: $routeParams.id}, function (d) {
                    update();
                    Messages.send("Container restarted", $routeParams.id);
                }, function (e) {
                    update();
                    Messages.error("Failure", "Container failed to restart." + e.data);
                });
            };

            $scope.hasContent = function (data) {
                return data !== null && data !== undefined;
            };

            $scope.getChanges = function () {
                ViewSpinner.spin();
                Container.changes({id: $routeParams.id}, function (d) {
                    $scope.changes = d;
                    ViewSpinner.stop();
                });
            };

            $scope.renameContainer = function () {
                // #FIXME fix me later to handle http status to show the correct error message
                Container.rename({id: $routeParams.id, 'name': $scope.container.newContainerName}, function (data) {
                    if (data.name) {
                        $scope.container.Name = data.name;
                        Messages.send("Container renamed", $routeParams.id);
                    } else {
                        $scope.container.newContainerName = $scope.container.Name;
                        Messages.error("Failure", "Container failed to rename.");
                    }
                });
                $scope.container.edit = false;
            };

            $scope.addEntry = function (array, entry) {
                array.push(entry);
            };
            $scope.rmEntry = function (array, entry) {
                var idx = array.indexOf(entry);
                array.splice(idx, 1);
            };

            $scope.toggleEdit = function() {
                $scope.edit = !$scope.edit;
            };

            update();
            $scope.getChanges();
        }]);


angular.module('containerLogs', [])
    .controller('ContainerLogsController', ['$scope', '$routeParams', '$location', '$anchorScroll', 'ContainerLogs', 'Container', 'ViewSpinner',
        function ($scope, $routeParams, $location, $anchorScroll, ContainerLogs, Container, ViewSpinner) {
            $scope.stdout = '';
            $scope.stderr = '';
            $scope.showTimestamps = false;
            $scope.tailLines = 2000;

            ViewSpinner.spin();
            Container.get({id: $routeParams.id}, function (d) {
                $scope.container = d;
                ViewSpinner.stop();
            }, function (e) {
                if (e.status === 404) {
                    Messages.error("Not found", "Container not found.");
                } else {
                    Messages.error("Failure", e.data);
                }
                ViewSpinner.stop();
            });

            function getLogs() {
                ViewSpinner.spin();
                ContainerLogs.get($routeParams.id, {
                    stdout: 1,
                    stderr: 0,
                    timestamps: $scope.showTimestamps,
                    tail: $scope.tailLines
                }, function (data, status, headers, config) {
                    // Replace carriage returns with newlines to clean up output
                    data = data.replace(/[\r]/g, '\n');
                    // Strip 8 byte header from each line of output
                    data = data.substring(8);
                    data = data.replace(/\n(.{8})/g, '\n');
                    $scope.stdout = data;
                    ViewSpinner.stop();
                });

                ContainerLogs.get($routeParams.id, {
                    stdout: 0,
                    stderr: 1,
                    timestamps: $scope.showTimestamps,
                    tail: $scope.tailLines
                }, function (data, status, headers, config) {
                    // Replace carriage returns with newlines to clean up output
                    data = data.replace(/[\r]/g, '\n');
                    // Strip 8 byte header from each line of output
                    data = data.substring(8);
                    data = data.replace(/\n(.{8})/g, '\n');
                    $scope.stderr = data;
                    ViewSpinner.stop();
                });
            }

            // initial call
            getLogs();
            var logIntervalId = window.setInterval(getLogs, 5000);

            $scope.$on("$destroy", function () {
                // clearing interval when view changes
                clearInterval(logIntervalId);
            });

            $scope.scrollTo = function (id) {
                $location.hash(id);
                $anchorScroll();
            };

            $scope.toggleTimestamps = function () {
                getLogs();
            };

            $scope.toggleTail = function () {
                getLogs();
            };
        }]);

angular.module('containerTop', [])
    .controller('ContainerTopController', ['$scope', '$routeParams', 'ContainerTop', 'Container', 'ViewSpinner', function ($scope, $routeParams, ContainerTop, Container, ViewSpinner) {
        $scope.ps_args = '';

        /**
         * Get container processes
         */
        $scope.getTop = function () {
            ViewSpinner.spin();
            ContainerTop.get($routeParams.id, {
                ps_args: $scope.ps_args
            }, function (data) {
                $scope.containerTop = data;
                ViewSpinner.stop();
            });
        };

        Container.get({id: $routeParams.id}, function (d) {
            $scope.containerName = d.Name.substring(1);
        }, function (e) {
            Messages.error("Failure", e.data);
        });

        $scope.getTop();
    }]);
angular.module('containers', [])
    .controller('ContainersController', ['$scope', 'Container', 'Settings', 'Messages', 'ViewSpinner',
        function ($scope, Container, Settings, Messages, ViewSpinner) {
            $scope.sortType = 'Created';
            $scope.sortReverse = true;
            $scope.toggle = false;
            $scope.displayAll = Settings.displayAll;

            $scope.order = function (sortType) {
                $scope.sortReverse = ($scope.sortType === sortType) ? !$scope.sortReverse : false;
                $scope.sortType = sortType;
            };

            var update = function (data) {
                ViewSpinner.spin();
                Container.query(data, function (d) {
                    $scope.containers = d.filter(function (container) {
                      return container.Image !== 'swarm';
                    }).map(function (container) {
                          return new ContainerViewModel(container);
                    });
                    ViewSpinner.stop();
                });
            };

            var batch = function (items, action, msg) {
                ViewSpinner.spin();
                var counter = 0;
                var complete = function () {
                    counter = counter - 1;
                    if (counter === 0) {
                        ViewSpinner.stop();
                        update({all: Settings.displayAll ? 1 : 0});
                    }
                };
                angular.forEach(items, function (c) {
                    if (c.Checked) {
                        if (action === Container.start) {
                            Container.get({id: c.Id}, function (d) {
                                c = d;
                                counter = counter + 1;
                                action({id: c.Id, HostConfig: c.HostConfig || {}}, function (d) {
                                    Messages.send("Container " + msg, c.Id);
                                    var index = $scope.containers.indexOf(c);
                                    complete();
                                }, function (e) {
                                    Messages.error("Failure", e.data);
                                    complete();
                                });
                            }, function (e) {
                                if (e.status === 404) {
                                    $('.detail').hide();
                                    Messages.error("Not found", "Container not found.");
                                } else {
                                    Messages.error("Failure", e.data);
                                }
                                complete();
                            });
                        }
                        else {
                            counter = counter + 1;
                            action({id: c.Id}, function (d) {
                                Messages.send("Container " + msg, c.Id);
                                var index = $scope.containers.indexOf(c);
                                complete();
                            }, function (e) {
                                Messages.error("Failure", e.data);
                                complete();
                            });

                        }

                    }
                });
                if (counter === 0) {
                    ViewSpinner.stop();
                }
            };

            $scope.toggleSelectAll = function () {
                angular.forEach($scope.filteredContainers, function (i) {
                    i.Checked = $scope.toggle;
                });
            };

            $scope.toggleGetAll = function () {
                Settings.displayAll = $scope.displayAll;
                update({all: Settings.displayAll ? 1 : 0});
            };

            $scope.startAction = function () {
                batch($scope.containers, Container.start, "Started");
            };

            $scope.stopAction = function () {
                batch($scope.containers, Container.stop, "Stopped");
            };

            $scope.restartAction = function () {
                batch($scope.containers, Container.restart, "Restarted");
            };

            $scope.killAction = function () {
                batch($scope.containers, Container.kill, "Killed");
            };

            $scope.pauseAction = function () {
                batch($scope.containers, Container.pause, "Paused");
            };

            $scope.unpauseAction = function () {
                batch($scope.containers, Container.unpause, "Unpaused");
            };

            $scope.removeAction = function () {
                batch($scope.containers, Container.remove, "Removed");
            };

            update({all: Settings.displayAll ? 1 : 0});
        }]);

angular.module('containers', [])
  .controller('ContainersController', ['$scope', 'Container', 'Settings', 'Messages', 'ViewSpinner',
  function ($scope, Container, Settings, Messages, ViewSpinner) {

  $scope.state = {};
  $scope.state.displayAll = Settings.displayAll;
  $scope.sortType = 'Created';
  $scope.sortReverse = true;
  $scope.state.toggle = false;

  $scope.order = function (sortType) {
    $scope.sortReverse = ($scope.sortType === sortType) ? !$scope.sortReverse : false;
    $scope.sortType = sortType;
  };

  var update = function (data) {
    ViewSpinner.spin();
    Container.query(data, function (d) {
      $scope.containers = d.filter(function (container) {
        return container.Image !== 'swarm';
      }).map(function (container) {
        return new ContainerViewModel(container);
      });
      ViewSpinner.stop();
    });
  };

  $scope.toggleSelectAll = function () {
    angular.forEach($scope.state.filteredContainers, function (i) {
      i.Checked = $scope.state.toggle;
    });
  };

  $scope.toggleGetAll = function () {
    Settings.displayAll = $scope.state.displayAll;
    update({all: Settings.displayAll ? 1 : 0});
  };

  update({all: Settings.displayAll ? 1 : 0});
}]);

angular.module('dashboard', [])
    .controller('DashboardController', ['$scope', 'Container', 'Image', 'Settings', 'LineChart', function ($scope, Container, Image, Settings, LineChart) {
        $scope.predicate = '-Created';
        $scope.containers = [];

        var getStarted = function (data) {
            $scope.totalContainers = data.length;
            LineChart.build('#containers-started-chart', data, function (c) {
                return new Date(c.Created * 1000).toLocaleDateString();
            });
            var s = $scope;
            Image.query({}, function (d) {
                s.totalImages = d.length;
                LineChart.build('#images-created-chart', d, function (c) {
                    return new Date(c.Created * 1000).toLocaleDateString();
                });
            });
        };

        var opts = {animation: false};
        if (Settings.firstLoad) {
            opts.animation = true;
            Settings.firstLoad = false;
            localStorage.setItem('firstLoad', false);
            $('#masthead').show();

            setTimeout(function () {
                $('#masthead').slideUp('slow');
            }, 5000);
        }

        Container.query({all: 1}, function (d) {
            var running = 0;
            var ghost = 0;
            var stopped = 0;

            var containers = d.filter(function (container) {
              return container.Image !== 'swarm';
            });
            for (var i = 0; i < containers.length; i++) {
                var item = containers[i];

                if (item.Status === "Ghost") {
                    ghost += 1;
                } else if (item.Status.indexOf('Exit') !== -1) {
                    stopped += 1;
                } else {
                    running += 1;
                    $scope.containers.push(new ContainerViewModel(item));
                }
            }

            getStarted(containers);

            var c = new Chart($('#containers-chart').get(0).getContext("2d"));
            var data = [
                {
                    value: running,
                    color: '#5bb75b',
                    title: 'Running'
                }, // running
                {
                    value: stopped,
                    color: '#C7604C',
                    title: 'Stopped'
                }, // stopped
                {
                    value: ghost,
                    color: '#E2EAE9',
                    title: 'Ghost'
                } // ghost
            ];

            c.Doughnut(data, opts);
            var lgd = $('#chart-legend').get(0);
            legend(lgd, data);
        });
    }]);

angular.module('dashboard', [])
  .controller('DashboardController', ['$scope', 'Container', 'Image', 'Settings', 'LineChart', function ($scope, Container, Image, Settings, LineChart) {

  $scope.containerData = {};

  var buildCharts = function (data) {
    $scope.containerData.total = data.length;
    LineChart.build('#containers-started-chart', data, function (c) {
      return new Date(c.Created * 1000).toLocaleDateString();
    });
    var s = $scope;
    Image.query({}, function (d) {
      s.totalImages = d.length;
      LineChart.build('#images-created-chart', d, function (c) {
        return new Date(c.Created * 1000).toLocaleDateString();
      });
    });
  };

  Container.query({all: 1}, function (d) {
    var running = 0;
    var ghost = 0;
    var stopped = 0;

    // TODO: centralize that
    var containers = d.filter(function (container) {
      return container.Image !== 'swarm';
    });

    for (var i = 0; i < containers.length; i++) {
      var item = containers[i];
      if (item.Status === "Ghost") {
        ghost += 1;
      } else if (item.Status.indexOf('Exit') !== -1) {
        stopped += 1;
      } else {
        running += 1;
      }
    }
    $scope.containerData.running = running;
    $scope.containerData.stopped = stopped;
    $scope.containerData.ghost = ghost;

    buildCharts(containers);
  });
}]);

angular.module('dashboard')
    .controller('MasterCtrl', ['$scope', '$cookieStore', 'Settings', MasterCtrl]);

function MasterCtrl($scope, $cookieStore, Settings) {
    /**
     * Sidebar Toggle & Cookie Control
     */
    var mobileView = 992;

    $scope.getWidth = function() {
        return window.innerWidth;
    };

    $scope.$watch($scope.getWidth, function(newValue, oldValue) {
        if (newValue >= mobileView) {
            if (angular.isDefined($cookieStore.get('toggle'))) {
                $scope.toggle = ! $cookieStore.get('toggle') ? false : true;
            } else {
                $scope.toggle = true;
            }
        } else {
            $scope.toggle = false;
        }

    });

    $scope.toggleSidebar = function() {
        $scope.toggle = !$scope.toggle;
        $cookieStore.put('toggle', $scope.toggle);
    };

    window.onresize = function() {
        $scope.$apply();
    };

    $scope.uiVersion = Settings.uiVersion;
}

angular.module('events', ['ngOboe'])
    .controller('EventsController', ['Settings', '$scope', 'Oboe', 'Messages', '$timeout', function (Settings, $scope, oboe, Messages, $timeout) {
        $scope.updateEvents = function () {
            $scope.dockerEvents = [];

            // TODO: Clean up URL building
            var url = Settings.url + '/events?';

            if ($scope.model.since) {
                var sinceSecs = Math.floor($scope.model.since.getTime() / 1000);
                url += 'since=' + sinceSecs + '&';
            }
            if ($scope.model.until) {
                var untilSecs = Math.floor($scope.model.until.getTime() / 1000);
                url += 'until=' + untilSecs;
            }

            oboe({
                url: url,
                pattern: '{id status time}'
            })
                .then(function (node) {
                    // finished loading
                    $timeout(function () {
                        $scope.$apply();
                    });
                }, function (error) {
                    // handle errors
                    Messages.error("Failure", error.data);
                }, function (node) {
                    // node received
                    $scope.dockerEvents.push(node);
                });
        };

        // Init
        $scope.model = {};
        $scope.model.since = new Date(Date.now() - 86400000); // 24 hours in the past
        $scope.model.until = new Date();
        $scope.updateEvents();

    }]);
angular.module('footer', [])
    .controller('FooterController', ['$scope', 'Settings', 'Version', function ($scope, Settings, Version) {
        $scope.template = 'app/components/footer/statusbar.html';

        $scope.uiVersion = Settings.uiVersion;
        Version.get({}, function (d) {
            $scope.apiVersion = d.ApiVersion;
        });
    }]);

angular.module('image', [])
    .controller('ImageController', ['$scope', '$q', '$routeParams', '$location', 'Image', 'Container', 'Messages', 'LineChart',
        function ($scope, $q, $routeParams, $location, Image, Container, Messages, LineChart) {
            $scope.history = [];
            $scope.tagInfo = {repo: '', version: '', force: false};
            $scope.id = '';
            $scope.repoTags = [];

            $scope.removeImage = function (id) {
                Image.remove({id: id}, function (d) {
                    d.forEach(function(msg){
                        var key = Object.keys(msg)[0];
                        Messages.send(key, msg[key]);
                    });
                    // If last message key is 'Deleted' then assume the image is gone and send to images page
                    if (d[d.length-1].Deleted) {
                        $location.path('/images');
                    } else {
                        $location.path('/images/' + $scope.id); // Refresh the current page.
                    }
                }, function (e) {
                    $scope.error = e.data;
                    $('#error-message').show();
                });
            };

            $scope.getHistory = function () {
                Image.history({id: $routeParams.id}, function (d) {
                    $scope.history = d;
                });
            };

            $scope.addTag = function () {
                var tag = $scope.tagInfo;
                Image.tag({
                    id: $routeParams.id,
                    repo: tag.repo,
                    tag: tag.version,
                    force: tag.force ? 1 : 0
                }, function (d) {
                    Messages.send("Tag Added", $routeParams.id);
                    $location.path('/images/' + $scope.id);
                }, function (e) {
                    $scope.error = e.data;
                    $('#error-message').show();
                });
            };

            function getContainersFromImage($q, Container, imageId) {
                var defer = $q.defer();

                Container.query({all: 1, notruc: 1}, function (d) {
                    var containers = [];
                    for (var i = 0; i < d.length; i++) {
                        var c = d[i];
                        if (c.ImageID === imageId) {
                            containers.push(new ContainerViewModel(c));
                        }
                    }
                    defer.resolve(containers);
                });

                return defer.promise;
            }

            /**
             * Get RepoTags from the /images/query endpoint instead of /image/json,
             * for backwards compatibility with Docker API versions older than 1.21
             * @param {string} imageId
             */
            function getRepoTags(imageId) {
                Image.query({}, function (d) {
                    d.forEach(function(image) {
                        if (image.Id === imageId && image.RepoTags[0] !== '<none>:<none>') {
                            $scope.RepoTags = image.RepoTags;
                        }
                    });
                });
            }

            Image.get({id: $routeParams.id}, function (d) {
                $scope.image = d;
                $scope.id = d.Id;
                if (d.RepoTags) {
                    $scope.RepoTags = d.RepoTags;
                } else {
                    getRepoTags($scope.id);
                }

                getContainersFromImage($q, Container, $scope.id).then(function (containers) {
                    LineChart.build('#containers-started-chart', containers, function (c) {
                        return new Date(c.Created * 1000).toLocaleDateString();
                    });
                });
            }, function (e) {
                if (e.status === 404) {
                    $('.detail').hide();
                    $scope.error = "Image not found.<br />" + $routeParams.id;
                } else {
                    $scope.error = e.data;
                }
                $('#error-message').show();
            });

            $scope.getHistory();
        }]);

angular.module('images', [])
    .controller('ImagesController', ['$scope', 'Image', 'ViewSpinner', 'Messages',
        function ($scope, Image, ViewSpinner, Messages) {
            $scope.sortType = 'Created';
            $scope.sortReverse = true;
            $scope.toggle = false;

            $scope.order = function(sortType) {
                $scope.sortReverse = ($scope.sortType === sortType) ? !$scope.sortReverse : false;
                $scope.sortType = sortType;
            };

            $scope.showBuilder = function () {
                $('#build-modal').modal('show');
            };

            $scope.removeAction = function () {
                ViewSpinner.spin();
                var counter = 0;
                var complete = function () {
                    counter = counter - 1;
                    if (counter === 0) {
                        ViewSpinner.stop();
                    }
                };
                angular.forEach($scope.images, function (i) {
                    if (i.Checked) {
                        counter = counter + 1;
                        Image.remove({id: i.Id}, function (d) {
                            angular.forEach(d, function (resource) {
                                Messages.send("Image deleted", resource.Deleted);
                            });
                            var index = $scope.images.indexOf(i);
                            $scope.images.splice(index, 1);
                            complete();
                        }, function (e) {
                            Messages.error("Failure", e.data);
                            complete();
                        });
                    }
                });
            };

            $scope.toggleSelectAll = function () {
                angular.forEach($scope.filteredImages, function (i) {
                    i.Checked = $scope.toggle;
                });
            };

            ViewSpinner.spin();
            Image.query({}, function (d) {
                $scope.images = d.map(function (item) {
                    return new ImageViewModel(item);
                });
                ViewSpinner.stop();
            }, function (e) {
                Messages.error("Failure", e.data);
                ViewSpinner.stop();
            });
        }]);

angular.module('images', [])
    .controller('ImagesController', ['$scope', 'Image', 'ViewSpinner', 'Messages',
        function ($scope, Image, ViewSpinner, Messages) {
          $scope.state = {};
            $scope.sortType = 'Created';
            $scope.sortReverse = true;
            $scope.state.toggle = false;

            $scope.order = function(sortType) {
                $scope.sortReverse = ($scope.sortType === sortType) ? !$scope.sortReverse : false;
                $scope.sortType = sortType;
            };

            $scope.toggleSelectAll = function () {
                angular.forEach($scope.state.filteredImages, function (i) {
                    i.Checked = $scope.state.toggle;
                });
            };

            ViewSpinner.spin();
            Image.query({}, function (d) {
                $scope.images = d.map(function (item) {
                    return new ImageViewModel(item);
                });
                ViewSpinner.stop();
            }, function (e) {
                Messages.error("Failure", e.data);
                ViewSpinner.stop();
            });
        }]);

angular.module('info', [])
  .controller('InfoController', ['$scope', 'Info', 'Version', 'Settings',
    function ($scope, Info, Version, Settings) {
      $scope.info = {};
      $scope.docker = {};
      $scope.swarm = {};
      $scope.endpoint = Settings.endpoint;

      Version.get({}, function (d) {
        $scope.docker = d;
      });
      Info.get({}, function (d) {
        $scope.info = d;
        extractSwarmInfo(d);
      });

      function extractSwarmInfo(info) {
        // Swarm info is available in SystemStatus object
        var systemStatus = info.SystemStatus;
        // Swarm strategy
        $scope.swarm[systemStatus[1][0]] = systemStatus[1][1];
        // Swarm filters
        $scope.swarm[systemStatus[2][0]] = systemStatus[2][1];
        // Swarm node count
        var node_count = parseInt(systemStatus[3][1], 10);
        $scope.swarm[systemStatus[3][0]] = node_count;

        $scope.swarm.Status = [];
        extractNodesInfo(systemStatus, node_count);
      }

      function extractNodesInfo(info, node_count) {
        // First information for node1 available at element #4 of SystemStatus
        // The next 10 elements are information related to the node
        var node_offset = 4;
        for (i = 0; i < node_count; i++) {
          extractNodeInfo(info, node_offset);
          node_offset += 9;
        }
      }

      function extractNodeInfo(info, offset) {
        var node = {};
        node.name = info[offset][0];
        node.ip = info[offset][1];
        node.status = info[offset + 1][1];
        node.containers = info[offset + 2][1];
        node.cpu = info[offset + 3][1];
        node.memory = info[offset + 4][1];
        node.labels = info[offset + 5][1];
        node.error = info[offset + 6][1];
        node.version = info[offset + 8][1];
        $scope.swarm.Status.push(node);
      }
    }]);

angular.module('masthead', [])
    .controller('MastheadController', ['$scope', 'Version', function ($scope, Version) {
        $scope.template = 'app/components/masthead/masthead.html';
        $scope.showNetworksVolumes = false;

        Version.get(function(d) {
            if (d.ApiVersion >= 1.21) {
                $scope.showNetworksVolumes = true;
            }
        });

        $scope.refresh = function() {
            location.reload();
        };
    }]);

angular.module('network', []).config(['$routeProvider', function ($routeProvider) {
    $routeProvider.when('/networks/:id/', {
        templateUrl: 'app/components/network/network.html',
        controller: 'NetworkController'
    });
}]).controller('NetworkController', ['$scope', 'Network', 'ViewSpinner', 'Messages', '$routeParams', '$location', 'errorMsgFilter',
    function ($scope, Network, ViewSpinner, Messages, $routeParams, $location, errorMsgFilter) {

        $scope.disconnect = function disconnect(networkId, containerId) {
            ViewSpinner.spin();
            Network.disconnect({id: $routeParams.id}, {Container: containerId}, function (d) {
                ViewSpinner.stop();
                Messages.send("Container disconnected", containerId);
                $location.path('/networks/' + $routeParams.id); // Refresh the current page.
            }, function (e) {
                ViewSpinner.stop();
                Messages.error("Failure", e.data);
            });
        };
        $scope.connect = function connect(networkId, containerId) {
            ViewSpinner.spin();
            Network.connect({id: $routeParams.id}, {Container: containerId}, function (d) {
                ViewSpinner.stop();
                var errmsg = errorMsgFilter(d);
                if (errmsg) {
                    Messages.error('Error', errmsg);
                } else {
                    Messages.send("Container connected", d);
                }
                $location.path('/networks/' + $routeParams.id); // Refresh the current page.
            }, function (e) {
                ViewSpinner.stop();
                Messages.error("Failure", e.data);
            });
        };
        $scope.remove = function remove(networkId) {
            ViewSpinner.spin();
            Network.remove({id: $routeParams.id}, function (d) {
                ViewSpinner.stop();
                Messages.send("Network removed", d);
                $location.path('/networks'); // Go to the networks page
            }, function (e) {
                ViewSpinner.stop();
                Messages.error("Failure", e.data);
            });
        };

        ViewSpinner.spin();
        Network.get({id: $routeParams.id}, function (d) {
            $scope.network = d;
            ViewSpinner.stop();
        }, function (e) {
            Messages.error("Failure", e.data);
            ViewSpinner.stop();
        });
    }]);

angular.module('networks', []).config(['$routeProvider', function ($routeProvider) {
    $routeProvider.when('/networks/', {
        templateUrl: 'app/components/networks/networks.html',
        controller: 'NetworksController'
    });
}]).controller('NetworksController', ['$scope', 'Network', 'ViewSpinner', 'Messages', '$route', 'errorMsgFilter',
    function ($scope, Network, ViewSpinner, Messages, $route, errorMsgFilter) {
        $scope.sortType = 'Name';
        $scope.sortReverse = true;
        $scope.toggle = false;
        $scope.order = function(sortType) {
            $scope.sortReverse = ($scope.sortType === sortType) ? !$scope.sortReverse : false;
            $scope.sortType = sortType;
        };
        $scope.createNetworkConfig = {
            "Name": '',
            "Driver": '',
            "IPAM": {
                "Config": [{
                    "Subnet": '',
                    "IPRange": '',
                    "Gateway": ''
                }]
            }
        };



        $scope.removeAction = function () {
            ViewSpinner.spin();
            var counter = 0;
            var complete = function () {
                counter = counter - 1;
                if (counter === 0) {
                    ViewSpinner.stop();
                }
            };
            angular.forEach($scope.networks, function (network) {
                if (network.Checked) {
                    counter = counter + 1;
                    Network.remove({id: network.Id}, function (d) {
                        Messages.send("Network deleted", network.Id);
                        var index = $scope.networks.indexOf(network);
                        $scope.networks.splice(index, 1);
                        complete();
                    }, function (e) {
                        Messages.error("Failure", e.data);
                        complete();
                    });
                }
            });
        };

        $scope.toggleSelectAll = function () {
            angular.forEach($scope.filteredNetworks, function (i) {
                i.Checked = $scope.toggle;
            });
        };

        $scope.addNetwork = function addNetwork(createNetworkConfig) {
            ViewSpinner.spin();
            Network.create(createNetworkConfig, function (d) {
                if (d.Id) {
                    Messages.send("Network created", d.Id);
                } else {
                    Messages.error('Failure', errorMsgFilter(d));
                }
                ViewSpinner.stop();
                fetchNetworks();
            }, function (e) {
                Messages.error("Failure", e.data);
                ViewSpinner.stop();
            });
        };

        function fetchNetworks() {
            ViewSpinner.spin();
            Network.query({}, function (d) {
                $scope.networks = d;
                ViewSpinner.stop();
            }, function (e) {
                Messages.error("Failure", e.data);
                ViewSpinner.stop();
            });
        }
        fetchNetworks();
    }]);

angular.module('networks', [])
.controller('NetworksController', ['$scope', 'Network', 'ViewSpinner', 'Messages', '$route', 'errorMsgFilter',
function ($scope, Network, ViewSpinner, Messages, $route, errorMsgFilter) {

  $scope.state = {};
  $scope.sortType = 'Name';
  $scope.sortReverse = true;
  $scope.state.toggle = false;
  $scope.order = function(sortType) {
    $scope.sortReverse = ($scope.sortType === sortType) ? !$scope.sortReverse : false;
    $scope.sortType = sortType;
  };

  $scope.toggleSelectAll = function () {
    angular.forEach($scope.state.filteredNetworks, function (i) {
      i.Checked = $scope.state.toggle;
    });
  };

  function fetchNetworks() {
    ViewSpinner.spin();
    Network.query({}, function (d) {
      $scope.networks = d;
      ViewSpinner.stop();
    }, function (e) {
      Messages.error("Failure", e.data);
      ViewSpinner.stop();
    });
  }
  fetchNetworks();
}]);

angular.module('pullImage', [])
    .controller('PullImageController', ['$scope', '$log', 'Messages', 'Image', 'ViewSpinner',
        function ($scope, $log, Messages, Image, ViewSpinner) {
            $scope.template = 'app/components/pullImage/pullImage.html';

            $scope.init = function () {
                $scope.config = {
                    registry: '',
                    repo: '',
                    fromImage: '',
                    tag: 'latest'
                };
            };

            $scope.init();

            function failedRequestHandler(e, Messages) {
                Messages.error('Error', errorMsgFilter(e));
            }

            $scope.pull = function () {
                $('#error-message').hide();
                var config = angular.copy($scope.config);
                var imageName = (config.registry ? config.registry + '/' : '' ) +
                    (config.repo ? config.repo + '/' : '') +
                    (config.fromImage) +
                    (config.tag ? ':' + config.tag : '');

                ViewSpinner.spin();
                $('#pull-modal').modal('hide');
                Image.create(config, function (data) {
                    ViewSpinner.stop();
                    if (data.constructor === Array) {
                        var f = data.length > 0 && data[data.length - 1].hasOwnProperty('error');
                        //check for error
                        if (f) {
                            var d = data[data.length - 1];
                            $scope.error = "Cannot pull image " + imageName + " Reason: " + d.error;
                            $('#pull-modal').modal('show');
                            $('#error-message').show();
                        } else {
                            Messages.send("Image Added", imageName);
                            $scope.init();
                        }
                    } else {
                        Messages.send("Image Added", imageName);
                        $scope.init();
                    }
                }, function (e) {
                    ViewSpinner.stop();
                    $scope.error = "Cannot pull image " + imageName + " Reason: " + e.data;
                    $('#pull-modal').modal('show');
                    $('#error-message').show();
                });
            };
        }]);

angular.module('sidebar', [])
    .controller('SideBarController', ['$scope', 'Container', 'Settings',
        function ($scope, Container, Settings) {
            $scope.template = 'partials/sidebar.html';
            $scope.containers = [];
            $scope.endpoint = Settings.endpoint;

            Container.query({all: 0}, function (d) {
                $scope.containers = d;
            });
        }]);

angular.module('startContainer', ['ui.bootstrap'])
    .controller('StartContainerController', ['$scope', '$routeParams', '$location', 'Container', 'Messages', 'containernameFilter', 'errorMsgFilter',
        function ($scope, $routeParams, $location, Container, Messages, containernameFilter, errorMsgFilter) {
            $scope.template = 'app/components/startContainer/startcontainer.html';

            Container.query({all: 1}, function (d) {
                $scope.containerNames = d.map(function (container) {
                    return containernameFilter(container);
                });
            });

            $scope.config = {
                Env: [],
                Labels: [],
                Volumes: [],
                SecurityOpts: [],
                HostConfig: {
                    PortBindings: [],
                    Binds: [],
                    Links: [],
                    Dns: [],
                    DnsSearch: [],
                    VolumesFrom: [],
                    CapAdd: [],
                    CapDrop: [],
                    Devices: [],
                    LxcConf: [],
                    ExtraHosts: []
                }
            };

            $scope.menuStatus = {
                containerOpen: true,
                hostConfigOpen: false
            };

            function failedRequestHandler(e, Messages) {
                Messages.error('Error', errorMsgFilter(e));
            }

            function rmEmptyKeys(col) {
                for (var key in col) {
                    if (col[key] === null || col[key] === undefined || col[key] === '' || ($.isPlainObject(col[key]) && $.isEmptyObject(col[key])) || col[key].length === 0) {
                        delete col[key];
                    }
                }
            }

            function getNames(arr) {
                return arr.map(function (item) {
                    return item.name;
                });
            }

            $scope.create = function () {
                // Copy the config before transforming fields to the remote API format
                var config = angular.copy($scope.config);

                config.Image = $routeParams.id;

                if (config.Cmd && config.Cmd[0] === "[") {
                    config.Cmd = angular.fromJson(config.Cmd);
                } else if (config.Cmd) {
                    config.Cmd = config.Cmd.split(' ');
                }

                config.Env = config.Env.map(function (envar) {
                    return envar.name + '=' + envar.value;
                });
                var labels = {};
                config.Labels = config.Labels.forEach(function(label) {
                    labels[label.key] = label.value;
                });
                config.Labels = labels;

                config.Volumes = getNames(config.Volumes);
                config.SecurityOpts = getNames(config.SecurityOpts);

                config.HostConfig.VolumesFrom = getNames(config.HostConfig.VolumesFrom);
                config.HostConfig.Binds = getNames(config.HostConfig.Binds);
                config.HostConfig.Links = getNames(config.HostConfig.Links);
                config.HostConfig.Dns = getNames(config.HostConfig.Dns);
                config.HostConfig.DnsSearch = getNames(config.HostConfig.DnsSearch);
                config.HostConfig.CapAdd = getNames(config.HostConfig.CapAdd);
                config.HostConfig.CapDrop = getNames(config.HostConfig.CapDrop);
                config.HostConfig.LxcConf = config.HostConfig.LxcConf.reduce(function (prev, cur, idx) {
                    prev[cur.name] = cur.value;
                    return prev;
                }, {});
                config.HostConfig.ExtraHosts = config.HostConfig.ExtraHosts.map(function (entry) {
                    return entry.host + ':' + entry.ip;
                });

                var ExposedPorts = {};
                var PortBindings = {};
                config.HostConfig.PortBindings.forEach(function (portBinding) {
                    var intPort = portBinding.intPort + "/tcp";
                    if (portBinding.protocol === "udp") {
                        intPort = portBinding.intPort + "/udp";
                    }
                    var binding = {
                        HostIp: portBinding.ip,
                        HostPort: portBinding.extPort
                    };
                    if (portBinding.intPort) {
                        ExposedPorts[intPort] = {};
                        if (intPort in PortBindings) {
                            PortBindings[intPort].push(binding);
                        } else {
                            PortBindings[intPort] = [binding];
                        }
                    } else {
                        Messages.send('Warning', 'Internal port must be specified for PortBindings');
                    }
                });
                config.ExposedPorts = ExposedPorts;
                config.HostConfig.PortBindings = PortBindings;

                // Remove empty fields from the request to avoid overriding defaults
                rmEmptyKeys(config.HostConfig);
                rmEmptyKeys(config);

                var ctor = Container;
                var loc = $location;
                var s = $scope;
                Container.create(config, function (d) {
                    if (d.Id) {
                        var reqBody = config.HostConfig || {};
                        reqBody.id = d.Id;
                        ctor.start(reqBody, function (cd) {
                            if (cd.id) {
                                Messages.send('Container Started', d.Id);
                                $('#create-modal').modal('hide');
                                loc.path('/containers/' + d.Id + '/');
                            } else {
                                failedRequestHandler(cd, Messages);
                                ctor.remove({id: d.Id}, function () {
                                    Messages.send('Container Removed', d.Id);
                                });
                            }
                        }, function (e) {
                            failedRequestHandler(e, Messages);
                        });
                    } else {
                        failedRequestHandler(d, Messages);
                    }
                }, function (e) {
                    failedRequestHandler(e, Messages);
                });
            };

            $scope.addEntry = function (array, entry) {
                array.push(entry);
            };
            $scope.rmEntry = function (array, entry) {
                var idx = array.indexOf(entry);
                array.splice(idx, 1);
            };
        }]);

angular.module('stats', [])
    .controller('StatsController', ['Settings', '$scope', 'Messages', '$timeout', 'Container', '$routeParams', 'humansizeFilter', '$sce', function (Settings, $scope, Messages, $timeout, Container, $routeParams, humansizeFilter, $sce) {
        // TODO: Force scale to 0-100 for cpu, fix charts on dashboard,
        // TODO: Force memory scale to 0 - max memory

        var cpuLabels = [];
        var cpuData = [];
        var memoryLabels = [];
        var memoryData = [];
        var networkLabels = [];
        var networkTxData = [];
        var networkRxData = [];
        for (var i = 0; i < 20; i++) {
            cpuLabels.push('');
            cpuData.push(0);
            memoryLabels.push('');
            memoryData.push(0);
            networkLabels.push('');
            networkTxData.push(0);
            networkRxData.push(0);
        }
        var cpuDataset = { // CPU Usage
            fillColor: "rgba(151,187,205,0.5)",
            strokeColor: "rgba(151,187,205,1)",
            pointColor: "rgba(151,187,205,1)",
            pointStrokeColor: "#fff",
            data: cpuData
        };
        var memoryDataset = {
            fillColor: "rgba(151,187,205,0.5)",
            strokeColor: "rgba(151,187,205,1)",
            pointColor: "rgba(151,187,205,1)",
            pointStrokeColor: "#fff",
            data: memoryData
        };
        var networkRxDataset = {
            label: "Rx Bytes",
            fillColor: "rgba(151,187,205,0.5)",
            strokeColor: "rgba(151,187,205,1)",
            pointColor: "rgba(151,187,205,1)",
            pointStrokeColor: "#fff",
            data: networkRxData
        };
        var networkTxDataset = {
            label: "Tx Bytes",
            fillColor: "rgba(255,180,174,0.5)",
            strokeColor: "rgba(255,180,174,1)",
            pointColor: "rgba(255,180,174,1)",
            pointStrokeColor: "#fff",
            data: networkTxData
        };
        var networkLegendData = [
            {
                //value: '',
                color: 'rgba(151,187,205,0.5)',
                title: 'Rx Data'
            },
            {
                //value: '',
                color: 'rgba(255,180,174,0.5)',
                title: 'Rx Data'
            }];
        legend($('#network-legend').get(0), networkLegendData);

        Chart.defaults.global.animationSteps = 30; // Lower from 60 to ease CPU load.
        var cpuChart = new Chart($('#cpu-stats-chart').get(0).getContext("2d")).Line({
            labels: cpuLabels,
            datasets: [cpuDataset]
        }, {
            responsive: true
        });

        var memoryChart = new Chart($('#memory-stats-chart').get(0).getContext('2d')).Line({
                labels: memoryLabels,
                datasets: [memoryDataset]
            },
            {
                scaleLabel: function (valueObj) {
                    return humansizeFilter(parseInt(valueObj.value, 10));
                },
                responsive: true
                //scaleOverride: true,
                //scaleSteps: 10,
                //scaleStepWidth: Math.ceil(initialStats.memory_stats.limit / 10),
                //scaleStartValue: 0
            });
        var networkChart = new Chart($('#network-stats-chart').get(0).getContext("2d")).Line({
            labels: networkLabels,
            datasets: [networkRxDataset, networkTxDataset]
        }, {
            scaleLabel: function (valueObj) {
                return humansizeFilter(parseInt(valueObj.value, 10));
            },
            responsive: true
        });
        $scope.networkLegend = $sce.trustAsHtml(networkChart.generateLegend());

        function updateStats() {
            Container.stats({id: $routeParams.id}, function (d) {
                var arr = Object.keys(d).map(function (key) {
                    return d[key];
                });
                if (arr.join('').indexOf('no such id') !== -1) {
                    Messages.error('Unable to retrieve stats', 'Is this container running?');
                    return;
                }

                // Update graph with latest data
                $scope.data = d;
                updateCpuChart(d);
                updateMemoryChart(d);
                updateNetworkChart(d);
                timeout = $timeout(updateStats, 5000);
            }, function () {
                Messages.error('Unable to retrieve stats', 'Is this container running?');
                timeout = $timeout(updateStats, 5000);
            });
        }

        var timeout;
        $scope.$on('$destroy', function () {
            $timeout.cancel(timeout);
        });

        updateStats();

        function updateCpuChart(data) {
            cpuChart.addData([calculateCPUPercent(data)], new Date(data.read).toLocaleTimeString());
            cpuChart.removeData();
        }

        function updateMemoryChart(data) {
            memoryChart.addData([data.memory_stats.usage], new Date(data.read).toLocaleTimeString());
            memoryChart.removeData();
        }

        var lastRxBytes = 0, lastTxBytes = 0;

        function updateNetworkChart(data) {
            // 1.9+ contains an object of networks, for now we'll just show stats for the first network
            // TODO: Show graphs for all networks
            if (data.networks) {
                $scope.networkName = Object.keys(data.networks)[0];
                data.network = data.networks[$scope.networkName];
            }
            var rxBytes = 0, txBytes = 0;
            if (lastRxBytes !== 0 || lastTxBytes !== 0) {
                // These will be zero on first call, ignore to prevent large graph spike
                rxBytes = data.network.rx_bytes - lastRxBytes;
                txBytes = data.network.tx_bytes - lastTxBytes;
            }
            lastRxBytes = data.network.rx_bytes;
            lastTxBytes = data.network.tx_bytes;
            networkChart.addData([rxBytes, txBytes], new Date(data.read).toLocaleTimeString());
            networkChart.removeData();
        }

        function calculateCPUPercent(stats) {
            // Same algorithm the official client uses: https://github.com/docker/docker/blob/master/api/client/stats.go#L195-L208
            var prevCpu = stats.precpu_stats;
            var curCpu = stats.cpu_stats;

            var cpuPercent = 0.0;

            // calculate the change for the cpu usage of the container in between readings
            var cpuDelta = curCpu.cpu_usage.total_usage - prevCpu.cpu_usage.total_usage;
            // calculate the change for the entire system between readings
            var systemDelta = curCpu.system_cpu_usage - prevCpu.system_cpu_usage;

            if (systemDelta > 0.0 && cpuDelta > 0.0) {
                cpuPercent = (cpuDelta / systemDelta) * curCpu.cpu_usage.percpu_usage.length * 100.0;
            }
            return cpuPercent;
        }

        Container.get({id: $routeParams.id}, function (d) {
            $scope.containerName = d.Name.substring(1);
        }, function (e) {
            Messages.error("Failure", e.data);
        });
    }])
;
angular.module('swarm', [])
  .controller('SwarmController', ['$scope', 'Info', 'Version', 'Settings',
    function ($scope, Info, Version, Settings) {

      $scope.sortType = 'Name';
      $scope.sortReverse = true;
      $scope.info = {};
      $scope.docker = {};
      $scope.swarm = {};

      $scope.order = function(sortType) {
        $scope.sortReverse = ($scope.sortType === sortType) ? !$scope.sortReverse : false;
        $scope.sortType = sortType;
      };

      Version.get({}, function (d) {
        $scope.docker = d;
      });
      Info.get({}, function (d) {
        $scope.info = d;
        extractSwarmInfo(d);
      });

      function extractSwarmInfo(info) {
        // Swarm info is available in SystemStatus object
        var systemStatus = info.SystemStatus;
        // Swarm strategy
        $scope.swarm[systemStatus[1][0]] = systemStatus[1][1];
        // Swarm filters
        $scope.swarm[systemStatus[2][0]] = systemStatus[2][1];
        // Swarm node count
        var node_count = parseInt(systemStatus[3][1], 10);
        $scope.swarm[systemStatus[3][0]] = node_count;

        $scope.swarm.Status = [];
        extractNodesInfo(systemStatus, node_count);
      }

      function extractNodesInfo(info, node_count) {
        // First information for node1 available at element #4 of SystemStatus
        // The next 10 elements are information related to the node
        var node_offset = 4;
        for (i = 0; i < node_count; i++) {
          extractNodeInfo(info, node_offset);
          node_offset += 9;
        }
      }

      function extractNodeInfo(info, offset) {
        var node = {};
        node.name = info[offset][0];
        node.ip = info[offset][1];
        node.status = info[offset + 1][1];
        node.containers = info[offset + 2][1];
        node.cpu = info[offset + 3][1];
        node.memory = info[offset + 4][1];
        node.labels = info[offset + 5][1];
        node.error = info[offset + 6][1];
        node.version = info[offset + 8][1];
        $scope.swarm.Status.push(node);
      }
    }]);

angular.module('volumes', []).config(['$routeProvider', function ($routeProvider) {
    $routeProvider.when('/volumes/', {
        templateUrl: 'app/components/volumes/volumes.html',
        controller: 'VolumesController'
    });
}]).controller('VolumesController', ['$scope', 'Volume', 'ViewSpinner', 'Messages', '$route', 'errorMsgFilter',
    function ($scope, Volume, ViewSpinner, Messages, $route, errorMsgFilter) {
        $scope.sortType = 'Name';
        $scope.sortReverse = true;
        $scope.toggle = false;
        $scope.order = function(sortType) {
            $scope.sortReverse = ($scope.sortType === sortType) ? !$scope.sortReverse : false;
            $scope.sortType = sortType;
        };
        $scope.createVolumeConfig = {
            "Name": "",
            "Driver": "",
            "DriverOpts": {}
        };
        $scope.driverOptions = [];

        $scope.addNewOption = function() {
          var newItemNo = $scope.driverOptions.length+1;
          $scope.driverOptions.push({});
        };

        $scope.removeOption = function() {
          var lastItem = $scope.driverOptions.length-1;
          $scope.driverOptions.splice(lastItem);
        };

        $scope.removeAction = function () {
            ViewSpinner.spin();
            var counter = 0;
            var complete = function () {
                counter = counter - 1;
                if (counter === 0) {
                    ViewSpinner.stop();
                }
            };
            angular.forEach($scope.volumes, function (volume) {
                if (volume.Checked) {
                    counter = counter + 1;
                    Volume.remove({name: volume.Name}, function (d) {
                        Messages.send("Volume deleted", volume.Name);
                        var index = $scope.volumes.indexOf(volume);
                        $scope.volumes.splice(index, 1);
                        complete();
                    }, function (e) {
                        Messages.error("Failure", e.data);
                        complete();
                    });
                }
            });
        };

        $scope.toggleSelectAll = function () {
            angular.forEach($scope.filteredVolumes, function (i) {
                i.Checked = $scope.toggle;
            });
        };

        $scope.addVolume = function addVolume(createVolumeConfig) {
            ViewSpinner.spin();
            assignOptions(createVolumeConfig);
            Volume.create(createVolumeConfig, function (d) {
                if (d.Name) {
                    Messages.send("Volume created", d.Name);
                } else {
                    Messages.error('Failure', errorMsgFilter(d));
                }
                ViewSpinner.stop();
                fetchVolumes();
            }, function (e) {
                Messages.error("Failure", e.data);
                ViewSpinner.stop();
            });
        };

        function assignOptions(createVolumeConfig) {
          createVolumeConfig.DriverOpts = {};
          angular.forEach($scope.driverOptions, function (option) {
            createVolumeConfig.DriverOpts[option.name] = option.value;
          });
        }

        function fetchVolumes() {
            ViewSpinner.spin();
            Volume.query({}, function (d) {
                $scope.volumes = d.Volumes;
                ViewSpinner.stop();
            }, function (e) {
                Messages.error("Failure", e.data);
                ViewSpinner.stop();
            });
        }
        fetchVolumes();
    }]);

angular.module('volumes', [])
.controller('VolumesController', ['$scope', 'Volume', 'ViewSpinner', 'Messages', '$route', 'errorMsgFilter',
function ($scope, Volume, ViewSpinner, Messages, $route, errorMsgFilter) {
  $scope.state = {};
  $scope.sortType = 'Name';
  $scope.sortReverse = true;
  $scope.state.toggle = false;
  $scope.order = function(sortType) {
    $scope.sortReverse = ($scope.sortType === sortType) ? !$scope.sortReverse : false;
    $scope.sortType = sortType;
  };

  $scope.toggleSelectAll = function () {
    angular.forEach($scope.state.filteredVolumes, function (i) {
      i.Checked = $scope.state.toggle;
    });
  };

  function fetchVolumes() {
    ViewSpinner.spin();
    Volume.query({}, function (d) {
      $scope.volumes = d.Volumes;
      ViewSpinner.stop();
    }, function (e) {
      Messages.error("Failure", e.data);
      ViewSpinner.stop();
    });
  }
  fetchVolumes();
}]);

/**
 * Loading Directive
 * @see http://tobiasahlin.com/spinkit/
 */

angular
    .module('uifordocker')
    .directive('rdLoading', rdLoading);

function rdLoading() {
    var directive = {
        restrict: 'AE',
        template: '<div class="loading"><div class="double-bounce1"></div><div class="double-bounce2"></div></div>'
    };
    return directive;
}

/**
 * Widget Body Directive
 */

angular
    .module('uifordocker')
    .directive('rdWidgetBody', rdWidgetBody);

function rdWidgetBody() {
    var directive = {
        requires: '^rdWidget',
        scope: {
            loading: '@?',
            classes: '@?'
        },
        transclude: true,
        template: '<div class="widget-body" ng-class="classes"><rd-loading ng-show="loading"></rd-loading><div ng-hide="loading" class="widget-content" ng-transclude></div></div>',
        restrict: 'E'
    };
    return directive;
}

/**
 * Widget Footer Directive
 */

angular
    .module('uifordocker')
    .directive('rdWidgetFooter', rdWidgetFooter);

function rdWidgetFooter() {
    var directive = {
        requires: '^rdWidget',
        transclude: true,
        template: '<div class="widget-footer" ng-transclude></div>',
        restrict: 'E'
    };
    return directive;
}

/**
 * Widget Header Directive
 */

angular
    .module('uifordocker')
    .directive('rdWidgetHeader', rdWidgetTitle);

function rdWidgetTitle() {
    var directive = {
        requires: '^rdWidget',
        scope: {
            title: '@',
            icon: '@'
        },
        transclude: true,
        template: '<div class="widget-header"><div class="row"><div class="pull-left"><i class="fa" ng-class="icon"></i> {{title}} </div><div class="pull-right col-xs-6 col-sm-4" ng-transclude></div></div></div>',
        restrict: 'E'
    };
    return directive;
}

/**
 * Widget Header Directive
 */

angular
    .module('uifordocker')
    .directive('rdWidgetTaskbar', rdWidgetTaskbar);

function rdWidgetTaskbar() {
    var directive = {
        requires: '^rdWidget',
        scope: {
          classes: '@?'
        },
        transclude: true,
        template: '<div class="widget-header"><div class="row"><div ng-class="classes" ng-transclude></div></div></div>',
        restrict: 'E'
    };
    return directive;
}

/**
 * Widget Directive
 */

angular
    .module('uifordocker')
    .directive('rdWidget', rdWidget);

function rdWidget() {
    var directive = {
        scope: {
          "ngModel": "="
        },
        transclude: true,
        template: '<div class="widget" ng-transclude></div>',
        restrict: 'EA'
    };
    return directive;

    function link(scope, element, attrs) {
        /* */
    }
}

angular.module('dockerui.filters', [])
    .filter('truncate', function () {
        'use strict';
        return function (text, length, end) {
            if (isNaN(length)) {
                length = 10;
            }

            if (end === undefined) {
                end = '...';
            }

            if (text.length <= length || text.length - end.length <= length) {
                return text;
            }
            else {
                return String(text).substring(0, length - end.length) + end;
            }
        };
    })
    .filter('statusbadge', function () {
        'use strict';
        return function (text) {
            if (text === 'Ghost') {
                return 'important';
            } else if (text === 'Unhealthy') {
                return 'danger';
            } else if (text.indexOf('Exit') !== -1 && text !== 'Exit 0') {
                return 'warning';
            }
            return 'success';
        };
    })
    .filter('getstatetext', function () {
        'use strict';
        return function (state) {
            if (state === undefined) {
                return '';
            }
            if (state.Ghost && state.Running) {
                return 'Ghost';
            }
            if (state.Running && state.Paused) {
                return 'Running (Paused)';
            }
            if (state.Running) {
                return 'Running';
            }
            return 'Stopped';
        };
    })
    .filter('getstatelabel', function () {
        'use strict';
        return function (state) {
            if (state === undefined) {
                return 'label-default';
            }

            if (state.Ghost && state.Running) {
                return 'label-important';
            }
            if (state.Running) {
                return 'label-success';
            }
            return 'label-default';
        };
    })
    .filter('humansize', function () {
        'use strict';
        return function (bytes) {
            var sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
            if (bytes === 0) {
                return 'n/a';
            }
            var i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)), 10);
            var value = bytes / Math.pow(1024, i);
            var decimalPlaces = (i < 1) ? 0 : (i - 1);
            return value.toFixed(decimalPlaces) + ' ' + sizes[[i]];
        };
    })
    .filter('containername', function () {
        'use strict';
        return function (container) {
            var name = container.Names[0];
            return name.substring(1, name.length);
        };
    })
    .filter('repotag', function () {
        'use strict';
        return function (image) {
            if (image.RepoTags && image.RepoTags.length > 0) {
                var tag = image.RepoTags[0];
                if (tag === '<none>:<none>') {
                    tag = '';
                }
                return tag;
            }
            return '';
        };
    })
    .filter('getdate', function () {
        'use strict';
        return function (data) {
            //Multiply by 1000 for the unix format
            var date = new Date(data * 1000);
            return date.toDateString();
        };
    })
    .filter('errorMsg', function () {
        return function (object) {
            var idx = 0;
            var msg = '';
            while (object[idx] && typeof(object[idx]) === 'string') {
                msg += object[idx];
                idx++;
            }
            return msg;
        };
    });

angular.module('dockerui.services', ['ngResource', 'ngSanitize'])
    .factory('Container', ['$resource', 'Settings', function ContainerFactory($resource, Settings) {
        'use strict';
        // Resource for interacting with the docker containers
        // http://docs.docker.com/reference/api/docker_remote_api_v1.20/#2-1-containers
        return $resource(Settings.url + '/containers/:id/:action', {
            name: '@name'
        }, {
            query: {method: 'GET', params: {all: 0, action: 'json'}, isArray: true},
            get: {method: 'GET', params: {action: 'json'}},
            start: {method: 'POST', params: {id: '@id', action: 'start'}},
            stop: {method: 'POST', params: {id: '@id', t: 5, action: 'stop'}},
            restart: {method: 'POST', params: {id: '@id', t: 5, action: 'restart'}},
            kill: {method: 'POST', params: {id: '@id', action: 'kill'}},
            pause: {method: 'POST', params: {id: '@id', action: 'pause'}},
            unpause: {method: 'POST', params: {id: '@id', action: 'unpause'}},
            changes: {method: 'GET', params: {action: 'changes'}, isArray: true},
            create: {method: 'POST', params: {action: 'create'}},
            remove: {method: 'DELETE', params: {id: '@id', v: 0}},
            rename: {method: 'POST', params: {id: '@id', action: 'rename'}, isArray: false},
            stats: {method: 'GET', params: {id: '@id', stream: false, action: 'stats'}, timeout: 5000}
        });
    }])
    .factory('ContainerCommit', ['$resource', '$http', 'Settings', function ContainerCommitFactory($resource, $http, Settings) {
        'use strict';
        // http://docs.docker.com/reference/api/docker_remote_api_v1.20/#create-a-new-image-from-a-container-s-changes
        return {
            commit: function (params, callback) {
                $http({
                    method: 'POST',
                    url: Settings.url + '/commit',
                    params: {
                        'container': params.id,
                        'tag': params.tag || null,
                        'repo': params.repo || null
                    },
                    data: params.config
                }).success(callback).error(function (data, status, headers, config) {
                    console.log(error, data);
                });
            }
        };
    }])
    .factory('ContainerLogs', ['$resource', '$http', 'Settings', function ContainerLogsFactory($resource, $http, Settings) {
        'use strict';
        // http://docs.docker.com/reference/api/docker_remote_api_v1.20/#get-container-logs
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
        // http://docs.docker.com/reference/api/docker_remote_api_v1.20/#list-processes-running-inside-a-container
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
        // http://docs.docker.com/reference/api/docker_remote_api_v1.20/#2-2-images
        return $resource(Settings.url + '/images/:id/:action', {}, {
            query: {method: 'GET', params: {all: 0, action: 'json'}, isArray: true},
            get: {method: 'GET', params: {action: 'json'}},
            search: {method: 'GET', params: {action: 'search'}},
            history: {method: 'GET', params: {action: 'history'}, isArray: true},
            create: {
                method: 'POST', isArray: true, transformResponse: [function f(data) {
                    var str = data.replace(/\n/g, " ").replace(/\}\W*\{/g, "}, {");
                    return angular.fromJson("[" + str + "]");
                }],
                params: {action: 'create', fromImage: '@fromImage', repo: '@repo', tag: '@tag', registry: '@registry'}
            },
            insert: {method: 'POST', params: {id: '@id', action: 'insert'}},
            push: {method: 'POST', params: {id: '@id', action: 'push'}},
            tag: {method: 'POST', params: {id: '@id', action: 'tag', force: 0, repo: '@repo', tag: '@tag'}},
            remove: {method: 'DELETE', params: {id: '@id'}, isArray: true},
            inspect: {method: 'GET', params: {id: '@id', action: 'json'}}
        });
    }])
    .factory('Version', ['$resource', 'Settings', function VersionFactory($resource, Settings) {
        'use strict';
        // http://docs.docker.com/reference/api/docker_remote_api_v1.20/#show-the-docker-version-information
        return $resource(Settings.url + '/version', {}, {
            get: {method: 'GET'}
        });
    }])
    .factory('Auth', ['$resource', 'Settings', function AuthFactory($resource, Settings) {
        'use strict';
        // http://docs.docker.com/reference/api/docker_remote_api_v1.20/#check-auth-configuration
        return $resource(Settings.url + '/auth', {}, {
            get: {method: 'GET'},
            update: {method: 'POST'}
        });
    }])
    .factory('Info', ['$resource', 'Settings', function InfoFactory($resource, Settings) {
        'use strict';
        // http://docs.docker.com/reference/api/docker_remote_api_v1.20/#display-system-wide-information
        return $resource(Settings.url + '/info', {}, {
            get: {method: 'GET'}
        });
    }])
    .factory('Network', ['$resource', 'Settings', function NetworkFactory($resource, Settings) {
        'use strict';
        // http://docs.docker.com/reference/api/docker_remote_api_v1.20/#2-5-networks
        return $resource(Settings.url + '/networks/:id/:action', {id: '@id'}, {
            query: {method: 'GET', isArray: true},
            get: {method: 'GET'},
            create: {method: 'POST', params: {action: 'create'}},
            remove: {method: 'DELETE'},
            connect: {method: 'POST', params: {action: 'connect'}},
            disconnect: {method: 'POST', params: {action: 'disconnect'}}
        });
    }])
    .factory('Volume', ['$resource', 'Settings', function VolumeFactory($resource, Settings) {
        'use strict';
        // http://docs.docker.com/reference/api/docker_remote_api_v1.20/#2-5-networks
        return $resource(Settings.url + '/volumes/:name/:action', {name: '@name'}, {
            query: {method: 'GET'},
            get: {method: 'GET'},
            create: {method: 'POST', params: {action: 'create'}},
            remove: {method: 'DELETE'}
        });
    }])
    .factory('Settings', ['DOCKER_ENDPOINT', 'DOCKER_PORT', 'UI_VERSION', function SettingsFactory(DOCKER_ENDPOINT, DOCKER_PORT, UI_VERSION) {
        'use strict';
        var url = DOCKER_ENDPOINT;
        if (DOCKER_PORT) {
            url = url + DOCKER_PORT + '\\' + DOCKER_PORT;
        }
        var firstLoad = (localStorage.getItem('firstLoad') || 'true') === 'true';
        return {
            displayAll: false,
            endpoint: DOCKER_ENDPOINT,
            uiVersion: UI_VERSION,
            url: url,
            firstLoad: firstLoad
        };
    }])
    .factory('ViewSpinner', function ViewSpinnerFactory() {
        'use strict';
        var spinner = new Spinner();
        var target = document.getElementById('view');

        return {
            spin: function () {
                spinner.spin(target);
            },
            stop: function () {
                spinner.stop();
            }
        };
    })
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
            error: function (title, text) {
                $.gritter.add({
                    title: $sanitize(title),
                    text: $sanitize(text),
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

function ImageViewModel(data) {
    this.Id = data.Id;
    this.Tag = data.Tag;
    this.Repository = data.Repository;
    this.Created = data.Created;
    this.Checked = false;
    this.RepoTags = data.RepoTags;
    this.VirtualSize = data.VirtualSize;
}

function ContainerViewModel(data) {
    this.Id = data.Id;
    this.Image = data.Image;
    this.Command = data.Command;
    this.Created = data.Created;
    this.SizeRw = data.SizeRw;
    this.Status = data.Status;
    this.Checked = false;
    this.Names = data.Names;
}

angular.module('uifordocker.templates', ['app/components/builder/builder.html', 'app/components/container/container.html', 'app/components/containerLogs/containerlogs.html', 'app/components/containerTop/containerTop.html', 'app/components/containers/containers.dup.html', 'app/components/containers/containers.html', 'app/components/dashboard/dashboard.dup.html', 'app/components/dashboard/dashboard.html', 'app/components/events/events.html', 'app/components/footer/statusbar.html', 'app/components/image/image.html', 'app/components/images/images.dup.html', 'app/components/images/images.html', 'app/components/info/info.html', 'app/components/masthead/masthead.html', 'app/components/network/network.html', 'app/components/networks/networks.dup.html', 'app/components/networks/networks.html', 'app/components/pullImage/pullImage.html', 'app/components/sidebar/sidebar.html', 'app/components/startContainer/startcontainer.html', 'app/components/stats/stats.html', 'app/components/swarm/swarm.html', 'app/components/volumes/volumes.dup.html', 'app/components/volumes/volumes.html']);

angular.module("app/components/builder/builder.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("app/components/builder/builder.html",
    "<div id=\"build-modal\" class=\"modal fade\">\n" +
    "    <div class=\"modal-dialog\">\n" +
    "        <div class=\"modal-content\">\n" +
    "            <div class=\"modal-header\">\n" +
    "                <button type=\"button\" class=\"close\" data-dismiss=\"modal\" aria-hidden=\"true\">&times;</button>\n" +
    "                <h3>Build Image</h3>\n" +
    "            </div>\n" +
    "            <div class=\"modal-body\">\n" +
    "                <div id=\"editor\"></div>\n" +
    "                <p>{{ messages }}</p>\n" +
    "            </div>\n" +
    "            <div class=\"modal-footer\">\n" +
    "                <a href=\"\" class=\"btn btn-primary\" ng-click=\"build()\">Build</a>\n" +
    "            </div>\n" +
    "        </div>\n" +
    "    </div>\n" +
    "</div>\n" +
    "");
}]);

angular.module("app/components/container/container.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("app/components/container/container.html",
    "<div class=\"detail\">\n" +
    "\n" +
    "    <div ng-if=\"!container.edit\">\n" +
    "        <h4>Container: {{ container.Name }}\n" +
    "            <button class=\"btn btn-primary\"\n" +
    "                    ng-click=\"container.edit = true;\">Rename\n" +
    "            </button>\n" +
    "        </h4>\n" +
    "    </div>\n" +
    "    <div ng-if=\"container.edit\">\n" +
    "        <h4>\n" +
    "            Container:\n" +
    "            <input type=\"text\" ng-model=\"container.newContainerName\">\n" +
    "            <button class=\"btn btn-success\"\n" +
    "                    ng-click=\"renameContainer()\">Save\n" +
    "            </button>\n" +
    "            <button class=\"btn btn-danger\"\n" +
    "                    ng-click=\"container.edit = false;\">&times;</button>\n" +
    "        </h4>\n" +
    "    </div>\n" +
    "\n" +
    "    <div class=\"btn-group detail\">\n" +
    "        <button class=\"btn btn-success\"\n" +
    "                ng-click=\"start()\"\n" +
    "                ng-show=\"!container.State.Running\">Start\n" +
    "        </button>\n" +
    "        <button class=\"btn btn-warning\"\n" +
    "                ng-click=\"stop()\"\n" +
    "                ng-show=\"container.State.Running && !container.State.Paused\">Stop\n" +
    "        </button>\n" +
    "        <button class=\"btn btn-danger\"\n" +
    "                ng-click=\"kill()\"\n" +
    "                ng-show=\"container.State.Running && !container.State.Paused\">Kill\n" +
    "        </button>\n" +
    "        <button class=\"btn btn-info\"\n" +
    "                ng-click=\"pause()\"\n" +
    "                ng-show=\"container.State.Running && !container.State.Paused\">Pause\n" +
    "        </button>\n" +
    "        <button class=\"btn btn-success\"\n" +
    "                ng-click=\"unpause()\"\n" +
    "                ng-show=\"container.State.Running && container.State.Paused\">Unpause\n" +
    "        </button>\n" +
    "        <button class=\"btn btn-success\"\n" +
    "                ng-click=\"restart()\"\n" +
    "                ng-show=\"container.State.Running && !container.State.Stopped\">Restart\n" +
    "        </button>\n" +
    "        <button class=\"btn btn-primary\"\n" +
    "                ng-click=\"commit()\">Commit\n" +
    "        </button>\n" +
    "    </div>\n" +
    "\n" +
    "    <table class=\"table table-striped\">\n" +
    "        <tbody>\n" +
    "        <tr>\n" +
    "            <td>Created:</td>\n" +
    "            <td>{{ container.Created | date: 'medium' }}</td>\n" +
    "        </tr>\n" +
    "        <tr>\n" +
    "            <td>Path:</td>\n" +
    "            <td>{{ container.Path }}</td>\n" +
    "        </tr>\n" +
    "        <tr>\n" +
    "            <td>Args:</td>\n" +
    "            <td>\n" +
    "                <pre>{{ container.Args.join(' ') || 'None' }}</pre>\n" +
    "            </td>\n" +
    "        </tr>\n" +
    "        <tr>\n" +
    "            <td>Exposed Ports:</td>\n" +
    "            <td>\n" +
    "                <ul>\n" +
    "                    <li ng-repeat=\"(k, v) in container.Config.ExposedPorts\">{{ k }}</li>\n" +
    "                </ul>\n" +
    "            </td>\n" +
    "        </tr>\n" +
    "        <tr>\n" +
    "            <td>Environment:</td>\n" +
    "            <td>\n" +
    "                <div ng-show=\"!editEnv\">\n" +
    "                    <button class=\"btn btn-default btn-xs pull-right\" ng-click=\"editEnv = true\"><i class=\"glyphicon glyphicon-pencil\"></i></button>\n" +
    "                    <ul>\n" +
    "                        <li ng-repeat=\"k in container.Config.Env\">{{ k }}</li>\n" +
    "                    </ul>\n" +
    "                </div>\n" +
    "                <div class=\"form-group\" ng-show=\"editEnv\">\n" +
    "                    <label>Env:</label>\n" +
    "\n" +
    "                    <div ng-repeat=\"envar in newCfg.Env\">\n" +
    "                        <div class=\"form-group form-inline\">\n" +
    "                            <div class=\"form-group\">\n" +
    "                                <label class=\"sr-only\">Variable Name:</label>\n" +
    "                                <input type=\"text\" ng-model=\"envar.name\" class=\"form-control input-sm\"\n" +
    "                                       placeholder=\"NAME\"/>\n" +
    "                            </div>\n" +
    "                            <div class=\"form-group\">\n" +
    "                                <label class=\"sr-only\">Variable Value:</label>\n" +
    "                                <input type=\"text\" ng-model=\"envar.value\" class=\"form-control input-sm\" style=\"width: 400px\"\n" +
    "                                       placeholder=\"value\"/>\n" +
    "                            </div>\n" +
    "                            <div class=\"form-group\">\n" +
    "                                <button class=\"btn btn-danger btn-sm input-sm form-control\"\n" +
    "                                        ng-click=\"rmEntry(newCfg.Env, envar)\"><i class=\"glyphicon glyphicon-remove\"></i>\n" +
    "                                </button>\n" +
    "                            </div>\n" +
    "                        </div>\n" +
    "                    </div>\n" +
    "                    <button type=\"button\" class=\"btn btn-success btn-sm\"\n" +
    "                            ng-click=\"addEntry(newCfg.Env, {name: '', value: ''})\"><i class=\"glyphicon glyphicon-plus\"></i> Add\n" +
    "                    </button>\n" +
    "                    <button class=\"btn btn-primary btn-sm\"\n" +
    "                            ng-click=\"restartEnv()\"\n" +
    "                            ng-show=\"!container.State.Restarting\">Commit and restart</button>\n" +
    "                </div>\n" +
    "\n" +
    "\n" +
    "            </td>\n" +
    "        </tr>\n" +
    "        <tr>\n" +
    "            <td>Labels:</td>\n" +
    "            <td>\n" +
    "                <table role=\"table\" class=\"table\">\n" +
    "                    <tr>\n" +
    "                        <th>Key</th>\n" +
    "                        <th>Value</th>\n" +
    "                    </tr>\n" +
    "                    <tr ng-repeat=\"(k, v) in container.Config.Labels\">\n" +
    "                        <td>{{ k }}</td>\n" +
    "                        <td>{{ v }}</td>\n" +
    "                    </tr>\n" +
    "                </table>\n" +
    "            </td>\n" +
    "        </tr>\n" +
    "\n" +
    "        <tr>\n" +
    "            <td>Publish All:</td>\n" +
    "            <td>{{ container.HostConfig.PublishAllPorts }}</td>\n" +
    "        </tr>\n" +
    "        <tr>\n" +
    "            <td>Ports:</td>\n" +
    "            <td>\n" +
    "                <div ng-show=\"!editPorts\">\n" +
    "                    <button class=\"btn btn-default btn-xs pull-right\" ng-click=\"editPorts = true\"><i class=\"glyphicon glyphicon-pencil\"></i></button>\n" +
    "                    <ul>\n" +
    "                    <li ng-repeat=\"(containerport, hostports) in container.NetworkSettings.Ports\">\n" +
    "                        {{ containerport }} =>\n" +
    "                        <span class=\"label label-default\" style=\"margin-right: 5px;\" ng-repeat=\"(k,v) in hostports\">{{ v.HostIp }}:{{ v.HostPort }}</span>\n" +
    "                    </li>\n" +
    "                </ul>\n" +
    "                </div>\n" +
    "                <div ng-show=\"editPorts\">\n" +
    "                    <div ng-repeat=\"(containerport, hostports) in newCfg.Ports\" style=\"margin-bottom: 5px;\">\n" +
    "                        <label>{{ containerport }}</label>\n" +
    "                        <div style=\"margin-left: 20px;\">\n" +
    "                            <div ng-repeat=\"(k,v) in hostports\" class=\"form-group form-inline\">\n" +
    "                                <div class=\"form-group\">\n" +
    "                                    <input type=\"text\" ng-model=\"v.HostIp\" class=\"form-control input-sm\" placeholder=\"IP address, ex. 0.0.0.0\" />\n" +
    "                                </div>\n" +
    "                                <div class=\"form-group\">\n" +
    "                                    <input type=\"text\" ng-model=\"v.HostPort\" class=\"form-control input-sm\"\n" +
    "                                           placeholder=\"Port\" />\n" +
    "                                </div>\n" +
    "                                <div class=\"form-group\">\n" +
    "                                    <button class=\"btn btn-danger btn-sm input-sm form-control\"\n" +
    "                                            ng-click=\"rmEntry(hostports, v)\"><i class=\"glyphicon glyphicon-remove\"></i>\n" +
    "                                    </button>\n" +
    "                                </div>\n" +
    "                            </div>\n" +
    "                        </div>\n" +
    "                        <button type=\"button\" class=\"btn btn-success btn-sm\"\n" +
    "                                ng-click=\"addEntry(hostports, {HostIp: '0.0.0.0', HostPort: ''})\"><i class=\"glyphicon glyphicon-plus\"></i> Add\n" +
    "                        </button>\n" +
    "                    </div>\n" +
    "                    <button class=\"btn btn-primary btn-sm\"\n" +
    "                            ng-click=\"restartEnv()\"\n" +
    "                            ng-show=\"!container.State.Restarting\">Commit and restart</button>\n" +
    "                </div>\n" +
    "            </td>\n" +
    "\n" +
    "        </tr>\n" +
    "        <tr>\n" +
    "            <td>Hostname:</td>\n" +
    "            <td>{{ container.Config.Hostname }}</td>\n" +
    "        </tr>\n" +
    "        <tr>\n" +
    "            <td>IPAddress:</td>\n" +
    "            <td>{{ container.NetworkSettings.IPAddress }}</td>\n" +
    "        </tr>\n" +
    "        <tr>\n" +
    "            <td>Cmd:</td>\n" +
    "            <td>{{ container.Config.Cmd }}</td>\n" +
    "        </tr>\n" +
    "        <tr>\n" +
    "            <td>Entrypoint:</td>\n" +
    "            <td>\n" +
    "                <pre>{{ container.Config.Entrypoint.join(' ') }}</pre>\n" +
    "            </td>\n" +
    "        </tr>\n" +
    "        <tr>\n" +
    "            <td>Bindings:</td>\n" +
    "            <td>\n" +
    "                <div ng-show=\"!editBinds\">\n" +
    "                    <button class=\"btn btn-default btn-xs pull-right\" ng-click=\"editBinds = true\"><i class=\"glyphicon glyphicon-pencil\"></i></button>\n" +
    "\n" +
    "                    <ul>\n" +
    "                        <li ng-repeat=\"b in container.HostConfig.Binds\">{{ b }}</li>\n" +
    "                    </ul>\n" +
    "                </div>\n" +
    "                <div ng-show=\"editBinds\">\n" +
    "                    <div ng-repeat=\"(vol, b) in newCfg.Binds\" class=\"form-group form-inline\">\n" +
    "                        <div class=\"form-group\">\n" +
    "                            <input type=\"text\" ng-model=\"b.HostPath\" class=\"form-control input-sm\"\n" +
    "                                   placeholder=\"Host path or volume name\" style=\"width: 250px;\" />\n" +
    "                        </div>\n" +
    "                        <div class=\"form-group\">\n" +
    "                            <input type=\"text\" ng-model=\"b.ContPath\" ng-readonly=\"b.DefaultBind\" class=\"form-control input-sm\" placeholder=\"Container path\" />\n" +
    "                        </div>\n" +
    "                        <div class=\"form-group\">\n" +
    "                            <label><input type=\"checkbox\" ng-model=\"b.ReadOnly\" /> read only</label>\n" +
    "                        </div>\n" +
    "                        <div class=\"form-group\">\n" +
    "                            <button class=\"btn btn-danger btn-sm input-sm form-control\"\n" +
    "                                    ng-click=\"rmEntry(newCfg.Binds, b)\"><i class=\"glyphicon glyphicon-remove\"></i>\n" +
    "                            </button>\n" +
    "                        </div>\n" +
    "                    </div>\n" +
    "                    <button type=\"button\" class=\"btn btn-success btn-sm\"\n" +
    "                            ng-click=\"addEntry(newCfg.Binds, { ContPath: '', HostPath: '', ReadOnly: false, DefaultBind: false })\"><i class=\"glyphicon glyphicon-plus\"></i> Add\n" +
    "                    </button>\n" +
    "                    <button class=\"btn btn-primary btn-sm\"\n" +
    "                            ng-click=\"restartEnv()\"\n" +
    "                            ng-show=\"!container.State.Restarting\">Commit and restart</button>\n" +
    "\n" +
    "                </div>\n" +
    "            </td>\n" +
    "        </tr>\n" +
    "        <tr>\n" +
    "            <td>Volumes:</td>\n" +
    "            <td>{{ container.Volumes }}</td>\n" +
    "        </tr>\n" +
    "\n" +
    "        <tr>\n" +
    "            <td>SysInitpath:</td>\n" +
    "            <td>{{ container.SysInitPath }}</td>\n" +
    "        </tr>\n" +
    "        <tr>\n" +
    "            <td>Image:</td>\n" +
    "            <td><a href=\"#/images/{{ container.Image }}/\">{{ container.Image }}</a></td>\n" +
    "        </tr>\n" +
    "        <tr>\n" +
    "            <td>State:</td>\n" +
    "            <td>\n" +
    "                <accordion close-others=\"true\">\n" +
    "                    <accordion-group heading=\"{{ container.State|getstatetext }}\">\n" +
    "                        <ul>\n" +
    "                            <li ng-repeat=\"(key, val) in container.State\">{{key}} : {{ val }}</li>\n" +
    "                        </ul>\n" +
    "                    </accordion-group>\n" +
    "                </accordion>\n" +
    "            </td>\n" +
    "        </tr>\n" +
    "        <tr>\n" +
    "            <td>Logs:</td>\n" +
    "            <td><a href=\"#/containers/{{ container.Id }}/logs\">stdout/stderr</a></td>\n" +
    "        </tr>\n" +
    "        <tr>\n" +
    "            <td>Stats:</td>\n" +
    "            <td><a href=\"#/containers/{{ container.Id }}/stats\">stats</a></td>\n" +
    "        </tr>\n" +
    "        <tr>\n" +
    "            <td>Top:</td>\n" +
    "            <td><a href=\"#/containers/{{ container.Id }}/top\">Top</a></td>\n" +
    "        </tr>\n" +
    "        </tbody>\n" +
    "    </table>\n" +
    "\n" +
    "    <div class=\"row-fluid\">\n" +
    "        <div class=\"span1\">\n" +
    "            Changes:\n" +
    "        </div>\n" +
    "        <div class=\"span5\">\n" +
    "            <i class=\"icon-refresh\" style=\"width:32px;height:32px;\" ng-click=\"getChanges()\"></i>\n" +
    "        </div>\n" +
    "    </div>\n" +
    "\n" +
    "    <div class=\"well well-large\">\n" +
    "        <ul>\n" +
    "            <li ng-repeat=\"change in changes | filter:hasContent\">\n" +
    "                <strong>{{ change.Path }}</strong> {{ change.Kind }}\n" +
    "            </li>\n" +
    "        </ul>\n" +
    "    </div>\n" +
    "\n" +
    "    <hr/>\n" +
    "\n" +
    "    <div class=\"btn-remove\">\n" +
    "        <button class=\"btn btn-large btn-block btn-primary btn-danger\" ng-click=\"remove()\">Remove Container</button>\n" +
    "    </div>\n" +
    "</div>\n" +
    "");
}]);

angular.module("app/components/containerLogs/containerlogs.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("app/components/containerLogs/containerlogs.html",
    "<div class=\"row logs\">\n" +
    "    <div class=\"col-xs-12\">\n" +
    "        <h4>Logs for container: <a href=\"#/containers/{{ container.Id }}/\">{{ container.Name }}</a></td></h4>\n" +
    "\n" +
    "        <div class=\"btn-group detail\">\n" +
    "            <button class=\"btn btn-info\" ng-click=\"scrollTo('stdout')\">stdout</button>\n" +
    "            <button class=\"btn btn-warning\" ng-click=\"scrollTo('stderr')\">stderr</button>\n" +
    "        </div>\n" +
    "        <div class=\"pull-right col-xs-6\">\n" +
    "            <div class=\"col-xs-6\">\n" +
    "                <a class=\"btn btn-primary\" ng-click=\"toggleTail()\" role=\"button\">Reload logs</a>\n" +
    "                <input id=\"tailLines\" type=\"number\" ng-style=\"{width: '45px'}\"\n" +
    "                       ng-model=\"tailLines\" ng-keypress=\"($event.which === 13)? toggleTail() : 0\"/>\n" +
    "                <label for=\"tailLines\">lines</label>\n" +
    "            </div>\n" +
    "            <div class=\"col-xs-4\">\n" +
    "                <input id=\"timestampToggle\" type=\"checkbox\" ng-model=\"showTimestamps\"\n" +
    "                       ng-change=\"toggleTimestamps()\"/> <label for=\"timestampToggle\">Timestamps</label>\n" +
    "            </div>\n" +
    "        </div>\n" +
    "    </div>\n" +
    "\n" +
    "    <div class=\"col-xs-12\">\n" +
    "        <div class=\"panel panel-default\">\n" +
    "            <div class=\"panel-heading\">\n" +
    "                <h3 id=\"stdout\" class=\"panel-title\">STDOUT</h3>\n" +
    "            </div>\n" +
    "            <div class=\"panel-body\">\n" +
    "                <pre id=\"stdoutLog\" class=\"pre-scrollable pre-x-scrollable\">{{stdout}}</pre>\n" +
    "            </div>\n" +
    "        </div>\n" +
    "    </div>\n" +
    "    <div class=\"col-xs-12\">\n" +
    "        <div class=\"panel panel-default\">\n" +
    "            <div class=\"panel-heading\">\n" +
    "                <h3 id=\"stderr\" class=\"panel-title\">STDERR</h3>\n" +
    "            </div>\n" +
    "            <div class=\"panel-body\">\n" +
    "                <pre id=\"stderrLog\" class=\"pre-scrollable pre-x-scrollable\">{{stderr}}</pre>\n" +
    "            </div>\n" +
    "        </div>\n" +
    "    </div>\n" +
    "</div>\n" +
    "");
}]);

angular.module("app/components/containerTop/containerTop.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("app/components/containerTop/containerTop.html",
    "<div class=\"containerTop\">\n" +
    "    <div class=\"row\">\n" +
    "        <div class=\"col-xs-12\">\n" +
    "            <h1>Top for: {{ containerName }}</h1>\n" +
    "        </div>\n" +
    "    </div>\n" +
    "    <div class=\"row\">\n" +
    "        <div class=\"form-group col-xs-2\">\n" +
    "            <input type=\"text\" class=\"form-control\" placeholder=\"[options] (aux)\" ng-model=\"ps_args\">\n" +
    "        </div>\n" +
    "        <button type=\"button\" class=\"btn btn-default\" ng-click=\"getTop()\">Submit</button>\n" +
    "    </div>\n" +
    "    <div class=\"row\">\n" +
    "        <div class=\"col-xs-12\">\n" +
    "            <table class=\"table table-striped\">\n" +
    "                <thead>\n" +
    "                <tr>\n" +
    "                    <th ng-repeat=\"title in containerTop.Titles\">{{title}}</th>\n" +
    "                </tr>\n" +
    "                </thead>\n" +
    "                <tbody>\n" +
    "                <tr ng-repeat=\"processInfos in containerTop.Processes\">\n" +
    "                    <td ng-repeat=\"processInfo in processInfos track by $index\">{{processInfo}}</td>\n" +
    "                </tr>\n" +
    "                </tbody>\n" +
    "            </table>\n" +
    "        </div>\n" +
    "    </div>\n" +
    "</div>");
}]);

angular.module("app/components/containers/containers.dup.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("app/components/containers/containers.dup.html",
    "\n" +
    "<h2>Containers:</h2>\n" +
    "\n" +
    "<div>\n" +
    "    <ul class=\"nav nav-pills pull-left\">\n" +
    "        <li class=\"dropdown\">\n" +
    "            <a class=\"dropdown-toggle\" id=\"drop4\" role=\"button\" data-toggle=\"dropdown\" data-target=\"#\">Actions <b class=\"caret\"></b></a>\n" +
    "            <ul id=\"menu1\" class=\"dropdown-menu\" role=\"menu\" aria-labelledby=\"drop4\">\n" +
    "                <li><a tabindex=\"-1\" href=\"\" ng-click=\"startAction()\">Start</a></li>\n" +
    "                <li><a tabindex=\"-1\" href=\"\" ng-click=\"stopAction()\">Stop</a></li>\n" +
    "                <li><a tabindex=\"-1\" href=\"\" ng-click=\"restartAction()\">Restart</a></li>\n" +
    "                <li><a tabindex=\"-1\" href=\"\" ng-click=\"killAction()\">Kill</a></li>\n" +
    "                <li><a tabindex=\"-1\" href=\"\" ng-click=\"pauseAction()\">Pause</a></li>\n" +
    "                <li><a tabindex=\"-1\" href=\"\" ng-click=\"unpauseAction()\">Unpause</a></li>\n" +
    "                <li><a tabindex=\"-1\" href=\"\" ng-click=\"removeAction()\">Remove</a></li>\n" +
    "            </ul>\n" +
    "        </li>\n" +
    "    </ul>\n" +
    "\n" +
    "    <div class=\"pull-right form-inline\">\n" +
    "        <input type=\"checkbox\" ng-model=\"displayAll\" id=\"displayAll\" ng-change=\"toggleGetAll()\"/> <label for=\"displayAll\">Display All</label>&nbsp;\n" +
    "        <input type=\"text\" class=\"form-control\" style=\"vertical-align: center\" id=\"filter\" placeholder=\"Filter\" ng-model=\"filter\"/> <label class=\"sr-only\" for=\"filter\">Filter</label>\n" +
    "    </div>\n" +
    "</div>\n" +
    "<table class=\"table table-striped\">\n" +
    "    <thead>\n" +
    "        <tr>\n" +
    "            <th><label><input type=\"checkbox\" ng-model=\"toggle\" ng-change=\"toggleSelectAll()\" /> Select</label></th>\n" +
    "            <th>\n" +
    "                <a href=\"#/containers/\" ng-click=\"order('Names')\">\n" +
    "                    Name\n" +
    "                    <span ng-show=\"sortType == 'Names' && !sortReverse\" class=\"glyphicon glyphicon-chevron-down\"></span>\n" +
    "                    <span ng-show=\"sortType == 'Names' && sortReverse\" class=\"glyphicon glyphicon-chevron-up\"></span>\n" +
    "                </a>\n" +
    "            </th>\n" +
    "            <th>\n" +
    "                <a href=\"#/containers/\" ng-click=\"order('Image')\">\n" +
    "                    Image\n" +
    "                    <span ng-show=\"sortType == 'Image' && !sortReverse\" class=\"glyphicon glyphicon-chevron-down\"></span>\n" +
    "                    <span ng-show=\"sortType == 'Image' && sortReverse\" class=\"glyphicon glyphicon-chevron-up\"></span>\n" +
    "                </a>\n" +
    "            </th>\n" +
    "            <th>\n" +
    "                <a href=\"#/containers/\" ng-click=\"order('Command')\">\n" +
    "                    Command\n" +
    "                    <span ng-show=\"sortType == 'Command' && !sortReverse\" class=\"glyphicon glyphicon-chevron-down\"></span>\n" +
    "                    <span ng-show=\"sortType == 'Command' && sortReverse\" class=\"glyphicon glyphicon-chevron-up\"></span>\n" +
    "                </a>\n" +
    "            </th>\n" +
    "            <th>\n" +
    "                <a href=\"#/containers/\" ng-click=\"order('Created')\">\n" +
    "                    Created\n" +
    "                    <span ng-show=\"sortType == 'Created' && !sortReverse\" class=\"glyphicon glyphicon-chevron-down\"></span>\n" +
    "                    <span ng-show=\"sortType == 'Created' && sortReverse\" class=\"glyphicon glyphicon-chevron-up\"></span>\n" +
    "                </a>\n" +
    "            </th>\n" +
    "            <th>\n" +
    "                <a href=\"#/containers/\" ng-click=\"order('Status')\">\n" +
    "                    Status\n" +
    "                    <span ng-show=\"sortType == 'Status' && !sortReverse\" class=\"glyphicon glyphicon-chevron-down\"></span>\n" +
    "                    <span ng-show=\"sortType == 'Status' && sortReverse\" class=\"glyphicon glyphicon-chevron-up\"></span>\n" +
    "                </a>\n" +
    "            </th>\n" +
    "        </tr>\n" +
    "    </thead>\n" +
    "    <tbody>\n" +
    "        <tr ng-repeat=\"container in (filteredContainers = ( containers | filter:filter | orderBy:sortType:sortReverse))\">\n" +
    "            <td><input type=\"checkbox\" ng-model=\"container.Checked\" /></td>\n" +
    "            <td><a href=\"#/containers/{{ container.Id }}/\">{{ container|containername}}</a></td>\n" +
    "            <td><a href=\"#/images/{{ container.Image }}/\">{{ container.Image }}</a></td>\n" +
    "            <td>{{ container.Command|truncate:40 }}</td>\n" +
    "            <td>{{ container.Created|getdate }}</td>\n" +
    "            <td><span class=\"label label-{{ container.Status|statusbadge }}\">{{ container.Status }}</span></td>\n" +
    "        </tr>\n" +
    "    </tbody>\n" +
    "</table>\n" +
    "");
}]);

angular.module("app/components/containers/containers.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("app/components/containers/containers.html",
    "<div class=\"col-lg-12\">\n" +
    "  <rd-widget>\n" +
    "    <rd-widget-header icon=\"fa-tasks\" title=\"Containers\">\n" +
    "    </rd-widget-header>\n" +
    "    <rd-widget-taskbar classes=\"col-lg-12\">\n" +
    "      <div class=\"pull-left\">\n" +
    "        <div class=\"btn-group\" role=\"group\" aria-label=\"...\">\n" +
    "          <button type=\"button\" class=\"btn btn-default\">Start</button>\n" +
    "          <button type=\"button\" class=\"btn btn-default\">Stop</button>\n" +
    "          <button type=\"button\" class=\"btn btn-default\">Restart</button>\n" +
    "          <button type=\"button\" class=\"btn btn-default\">Kill</button>\n" +
    "          <button type=\"button\" class=\"btn btn-default\">Pause</button>\n" +
    "          <button type=\"button\" class=\"btn btn-default\">Unpause</button>\n" +
    "          <button type=\"button\" class=\"btn btn-default\">Remove</button>\n" +
    "        </div>\n" +
    "      </div>\n" +
    "      <div class=\"pull-right\">\n" +
    "        <input type=\"checkbox\" ng-model=\"state.displayAll\" id=\"displayAll\" ng-change=\"toggleGetAll()\"/><label for=\"displayAll\">Display All</label>\n" +
    "        <input type=\"text\" id=\"filter\" ng-model=\"state.filter\" placeholder=\"Filter...\" class=\"form-control input-sm\" />\n" +
    "      </div>\n" +
    "    </rd-widget-taskbar>\n" +
    "    <rd-widget-body classes=\"no-padding\">\n" +
    "      <div class=\"table-responsive\">\n" +
    "        <table class=\"table\">\n" +
    "          <thead>\n" +
    "            <tr>\n" +
    "              <th><label><input type=\"checkbox\" ng-model=\"state.toggle\" ng-change=\"toggleSelectAll()\" /> Select</label></th>\n" +
    "              <th>\n" +
    "                <a href=\"#/containers/\" ng-click=\"order('Names')\">\n" +
    "                  Name\n" +
    "                  <span ng-show=\"sortType == 'Names' && !sortReverse\" class=\"glyphicon glyphicon-chevron-down\"></span>\n" +
    "                  <span ng-show=\"sortType == 'Names' && sortReverse\" class=\"glyphicon glyphicon-chevron-up\"></span>\n" +
    "                </a>\n" +
    "              </th>\n" +
    "              <th>\n" +
    "                <a href=\"#/containers/\" ng-click=\"order('Image')\">\n" +
    "                  Image\n" +
    "                  <span ng-show=\"sortType == 'Image' && !sortReverse\" class=\"glyphicon glyphicon-chevron-down\"></span>\n" +
    "                  <span ng-show=\"sortType == 'Image' && sortReverse\" class=\"glyphicon glyphicon-chevron-up\"></span>\n" +
    "                </a>\n" +
    "              </th>\n" +
    "              <th>\n" +
    "                <a href=\"#/containers/\" ng-click=\"order('Command')\">\n" +
    "                  Command\n" +
    "                  <span ng-show=\"sortType == 'Command' && !sortReverse\" class=\"glyphicon glyphicon-chevron-down\"></span>\n" +
    "                  <span ng-show=\"sortType == 'Command' && sortReverse\" class=\"glyphicon glyphicon-chevron-up\"></span>\n" +
    "                </a>\n" +
    "              </th>\n" +
    "              <th>\n" +
    "                <a href=\"#/containers/\" ng-click=\"order('Created')\">\n" +
    "                  Created\n" +
    "                  <span ng-show=\"sortType == 'Created' && !sortReverse\" class=\"glyphicon glyphicon-chevron-down\"></span>\n" +
    "                  <span ng-show=\"sortType == 'Created' && sortReverse\" class=\"glyphicon glyphicon-chevron-up\"></span>\n" +
    "                </a>\n" +
    "              </th>\n" +
    "              <th>\n" +
    "                <a href=\"#/containers/\" ng-click=\"order('Status')\">\n" +
    "                  Status\n" +
    "                  <span ng-show=\"sortType == 'Status' && !sortReverse\" class=\"glyphicon glyphicon-chevron-down\"></span>\n" +
    "                  <span ng-show=\"sortType == 'Status' && sortReverse\" class=\"glyphicon glyphicon-chevron-up\"></span>\n" +
    "                </a>\n" +
    "              </th>\n" +
    "            </tr>\n" +
    "          </thead>\n" +
    "          <tbody>\n" +
    "            <tr ng-repeat=\"container in (state.filteredContainers = ( containers | filter:state.filter | orderBy:sortType:sortReverse))\">\n" +
    "              <td><input type=\"checkbox\" ng-model=\"container.Checked\" /></td>\n" +
    "              <td><a href=\"#/containers/{{ container.Id }}/\">{{ container|containername}}</a></td>\n" +
    "              <td><a href=\"#/images/{{ container.Image }}/\">{{ container.Image }}</a></td>\n" +
    "              <td>{{ container.Command|truncate:40 }}</td>\n" +
    "              <td>{{ container.Created|getdate }}</td>\n" +
    "              <td><span class=\"label label-{{ container.Status|statusbadge }}\">{{ container.Status }}</span></td>\n" +
    "            </tr>\n" +
    "          </tbody>\n" +
    "        </table>\n" +
    "      </div>\n" +
    "    </rd-widget-body>\n" +
    "  <rd-widget>\n" +
    "</div>\n" +
    "");
}]);

angular.module("app/components/dashboard/dashboard.dup.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("app/components/dashboard/dashboard.dup.html",
    "<div class=\"col-xs-offset-1\">\n" +
    "    <!--<div class=\"sidebar span4\">\n" +
    "        <div ng-include=\"template\" ng-controller=\"SideBarController\"></div>\n" +
    "    </div>-->\n" +
    "\n" +
    "    <div class=\"row\">\n" +
    "    	<div class=\"col-lg-3 col-md-6 col-xs-12\">\n" +
    "    		<rd-widget>\n" +
    "    			<rd-widget-body>\n" +
    "    				<div class=\"widget-icon green pull-left\">\n" +
    "    					<i class=\"fa fa-users\"></i>\n" +
    "    				</div>\n" +
    "    				<div class=\"title\">80</div>\n" +
    "    				<div class=\"comment\">Users</div>\n" +
    "    			</rd-widget-body>\n" +
    "    		</rd-widget>\n" +
    "    	</div>\n" +
    "    	<div class=\"col-lg-3 col-md-6 col-xs-12\">\n" +
    "    		<rd-widget>\n" +
    "    			<rd-widget-body>\n" +
    "    				<div class=\"widget-icon red pull-left\">\n" +
    "    					<i class=\"fa fa-tasks\"></i>\n" +
    "    				</div>\n" +
    "    				<div class=\"title\">16</div>\n" +
    "    				<div class=\"comment\">Servers</div>\n" +
    "    			</rd-widget-body>\n" +
    "    		</rd-widget>\n" +
    "    	</div>\n" +
    "    	<div class=\"col-lg-3 col-md-6 col-xs-12\">\n" +
    "    		<rd-widget>\n" +
    "    			<rd-widget-body>\n" +
    "    				<div class=\"widget-icon orange pull-left\">\n" +
    "    					<i class=\"fa fa-sitemap\"></i>\n" +
    "    				</div>\n" +
    "    				<div class=\"title\">225</div>\n" +
    "    				<div class=\"comment\">Documents</div>\n" +
    "    			</rd-widget-body>\n" +
    "    		</rd-widget>\n" +
    "    	</div>\n" +
    "    	<div class=\"col-lg-3 col-md-6 col-xs-12\">\n" +
    "    		<rd-widget>\n" +
    "    			<rd-widget-body>\n" +
    "    				<div class=\"widget-icon blue pull-left\">\n" +
    "    					<i class=\"fa fa-support\"></i>\n" +
    "    				</div>\n" +
    "    				<div class=\"title\">62</div>\n" +
    "    				<div class=\"comment\">Tickets</div>\n" +
    "    			</rd-widget-body>\n" +
    "    		</rd-widget>\n" +
    "    	</div>\n" +
    "    </div>\n" +
    "\n" +
    "    <div class=\"row\">\n" +
    "        <div class=\"col-xs-10\">\n" +
    "            <div class=\"col-xs-5\">\n" +
    "                <h3>Running Containers</h3>\n" +
    "                <ul>\n" +
    "                    <li ng-repeat=\"container in containers|orderBy:predicate\">\n" +
    "                        <a href=\"#/containers/{{ container.Id }}/\">{{ container|containername }}</a>\n" +
    "                        <span class=\"label label-{{ container.Status|statusbadge }}\">{{ container.Status }}</span>\n" +
    "                    </li>\n" +
    "                </ul>\n" +
    "            </div>\n" +
    "            <div class=\"col-xs-5 text-right\">\n" +
    "                <h3>Status</h3>\n" +
    "                <canvas id=\"containers-chart\" class=\"pull-right\">\n" +
    "                    <p class=\"browserupgrade\">You are using an <strong>outdated</strong> browser. Please <a\n" +
    "                            href=\"http://browsehappy.com/\">upgrade your browser</a> to improve your experience.</p>\n" +
    "                </canvas>\n" +
    "                <div id=\"chart-legend\"></div>\n" +
    "            </div>\n" +
    "        </div>\n" +
    "    </div>\n" +
    "\n" +
    "    <div class=\"row\">\n" +
    "        <div class=\"col-xs-10\" id=\"stats\">\n" +
    "            <h4>Containers created</h4>\n" +
    "            <canvas id=\"containers-started-chart\" width=\"700\">\n" +
    "                <p class=\"browserupgrade\">You are using an <strong>outdated</strong> browser. Please <a\n" +
    "                        href=\"http://browsehappy.com/\">upgrade your browser</a> to improve your experience.</p>\n" +
    "            </canvas>\n" +
    "            <h4>Images created</h4>\n" +
    "            <canvas id=\"images-created-chart\" width=\"700\">\n" +
    "                <p class=\"browserupgrade\">You are using an <strong>outdated</strong> browser. Please <a\n" +
    "                        href=\"http://browsehappy.com/\">upgrade your browser</a> to improve your experience.</p>\n" +
    "            </canvas>\n" +
    "        </div>\n" +
    "    </div>\n" +
    "</div>\n" +
    "");
}]);

angular.module("app/components/dashboard/dashboard.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("app/components/dashboard/dashboard.html",
    "<div class=\"row\">\n" +
    "  <div class=\"col-lg-3 col-md-6 col-xs-12\">\n" +
    "    <rd-widget>\n" +
    "      <rd-widget-body>\n" +
    "        <div class=\"widget-icon blue pull-left\">\n" +
    "          <i class=\"fa fa-tasks\"></i>\n" +
    "        </div>\n" +
    "        <div class=\"title\">{{ containerData.total }}</div>\n" +
    "        <div class=\"comment\">Containers</div>\n" +
    "      </rd-widget-body>\n" +
    "    </rd-widget>\n" +
    "  </div>\n" +
    "  <div class=\"col-lg-3 col-md-6 col-xs-12\">\n" +
    "    <rd-widget>\n" +
    "      <rd-widget-body>\n" +
    "        <div class=\"widget-icon green pull-left\">\n" +
    "          <i class=\"fa fa-tasks\"></i>\n" +
    "        </div>\n" +
    "        <div class=\"title\">{{ containerData.running }}</div>\n" +
    "        <div class=\"comment\">Running</div>\n" +
    "      </rd-widget-body>\n" +
    "    </rd-widget>\n" +
    "  </div>\n" +
    "  <div class=\"col-lg-3 col-md-6 col-xs-12\">\n" +
    "    <rd-widget>\n" +
    "      <rd-widget-body>\n" +
    "        <div class=\"widget-icon red pull-left\">\n" +
    "          <i class=\"fa fa-tasks\"></i>\n" +
    "        </div>\n" +
    "        <div class=\"title\">{{ containerData.stopped }}</div>\n" +
    "        <div class=\"comment\">Stopped</div>\n" +
    "      </rd-widget-body>\n" +
    "    </rd-widget>\n" +
    "  </div>\n" +
    "  <div class=\"col-lg-3 col-md-6 col-xs-12\">\n" +
    "    <rd-widget>\n" +
    "      <rd-widget-body>\n" +
    "        <div class=\"widget-icon gray pull-left\">\n" +
    "          <i class=\"fa fa-tasks\"></i>\n" +
    "        </div>\n" +
    "        <div class=\"title\">{{ containerData.ghost }}</div>\n" +
    "        <div class=\"comment\">Ghost</div>\n" +
    "      </rd-widget-body>\n" +
    "    </rd-widget>\n" +
    "  </div>\n" +
    "</div>\n" +
    "\n" +
    "<div class=\"row\">\n" +
    "  <div class=\"col-lg-6\">\n" +
    "    <rd-widget>\n" +
    "      <rd-widget-header icon=\"fa-tasks\" title=\"Containers created\"></rd-widget-header>\n" +
    "      <rd-widget-body classes=\"no-padding\">\n" +
    "        <canvas id=\"containers-started-chart\" width=\"770\" height=\"230\">\n" +
    "            <p class=\"browserupgrade\">You are using an <strong>outdated</strong> browser. Please <a\n" +
    "                    href=\"http://browsehappy.com/\">upgrade your browser</a> to improve your experience.</p>\n" +
    "        </canvas>\n" +
    "      </rd-widget-body>\n" +
    "    </rd-widget>\n" +
    "  </div>\n" +
    "  <div class=\"col-lg-6\">\n" +
    "    <rd-widget>\n" +
    "      <rd-widget-header icon=\"fa-tag\" title=\"Images created\"></rd-widget-header>\n" +
    "      <rd-widget-body classes=\"no-padding\">\n" +
    "        <canvas id=\"images-created-chart\" width=\"770\" height=\"230\">\n" +
    "            <p class=\"browserupgrade\">You are using an <strong>outdated</strong> browser. Please <a\n" +
    "                    href=\"http://browsehappy.com/\">upgrade your browser</a> to improve your experience.</p>\n" +
    "        </canvas>\n" +
    "      </rd-widget-body>\n" +
    "    </rd-widget>\n" +
    "  </div>\n" +
    "</div>\n" +
    "");
}]);

angular.module("app/components/events/events.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("app/components/events/events.html",
    "<div class=\"row\">\n" +
    "    <div class=\"col-xs-12\">\n" +
    "        <h2>Events</h2>\n" +
    "\n" +
    "        <form class=\"form-inline\">\n" +
    "            <div class=\"form-group\">\n" +
    "                <label for=\"since\">Since:</label>\n" +
    "                <input id=\"since\" type=\"datetime-local\" ng-model=\"model.since\" class=\"form-control\" step=\"any\"/>\n" +
    "            </div>\n" +
    "            <div class=\"form-group\">\n" +
    "                <label for=\"until\">Until:</label>\n" +
    "                <input id=\"until\" type=\"datetime-local\" ng-model=\"model.until\" class=\"form-control\" step=\"any\"/>\n" +
    "            </div>\n" +
    "            <button ng-click=\"updateEvents()\" class=\"btn btn-primary\">Update</button>\n" +
    "        </form>\n" +
    "        <br>\n" +
    "        <table class=\"table\">\n" +
    "            <tbody>\n" +
    "            <tr>\n" +
    "                <th>Event</th>\n" +
    "                <th>From</th>\n" +
    "                <th>ID</th>\n" +
    "                <th>Time</th>\n" +
    "            </tr>\n" +
    "            <tr ng-repeat=\"event in dockerEvents\">\n" +
    "                <td ng-bind=\"event.status\"/>\n" +
    "                <td ng-bind=\"event.from\"/>\n" +
    "                <td ng-bind=\"event.id\"/>\n" +
    "                <td ng-bind=\"event.time * 1000 | date:'medium'\"/>\n" +
    "            </tr>\n" +
    "            </tbody>\n" +
    "        </table>\n" +
    "    </div>\n" +
    "</div>\n" +
    "");
}]);

angular.module("app/components/footer/statusbar.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("app/components/footer/statusbar.html",
    "<footer class=\"center well\">\n" +
    "    <p>\n" +
    "        <small>Docker API Version: <strong>{{ apiVersion }}</strong> UI Version: <strong>{{ uiVersion }}</strong> <a\n" +
    "                class=\"pull-right\" href=\"https://github.com/deviantony/ui-for-docker\">UI For Docker</a></small>\n" +
    "    </p>\n" +
    "</footer>\n" +
    "");
}]);

angular.module("app/components/image/image.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("app/components/image/image.html",
    "<div ng-include=\"template\" ng-controller=\"StartContainerController\"></div>\n" +
    "\n" +
    "<div class=\"alert alert-error\" id=\"error-message\" style=\"display:none\">\n" +
    "    {{ error }}\n" +
    "</div>\n" +
    "\n" +
    "<div class=\"detail\">\n" +
    "\n" +
    "    <h4>Image: {{ id }}</h4>\n" +
    "\n" +
    "    <div class=\"btn-group detail\">\n" +
    "        <button class=\"btn btn-success\" data-toggle=\"modal\" data-target=\"#create-modal\">Start Container</button>\n" +
    "    </div>\n" +
    "\n" +
    "    <div>\n" +
    "        <h4>Containers created:</h4>\n" +
    "        <canvas id=\"containers-started-chart\" width=\"750\">\n" +
    "            <p class=\"browserupgrade\">You are using an <strong>outdated</strong> browser. Please <a\n" +
    "                    href=\"http://browsehappy.com/\">upgrade your browser</a> to improve your experience.</p>\n" +
    "        </canvas>\n" +
    "    </div>\n" +
    "\n" +
    "    <table class=\"table table-striped\">\n" +
    "        <tbody>\n" +
    "        <tr>\n" +
    "            <td>Tags:</td>\n" +
    "            <td>\n" +
    "                <ul>\n" +
    "                    <li ng-repeat=\"tag in RepoTags\">{{ tag }}\n" +
    "                        <button ng-click=\"removeImage(tag)\" class=\"btn btn-sm btn-danger\">Remove tag</button>\n" +
    "                    </li>\n" +
    "                </ul>\n" +
    "            </td>\n" +
    "        </tr>\n" +
    "        <tr>\n" +
    "            <td>Created:</td>\n" +
    "            <td>{{ image.Created | date: 'medium'}}</td>\n" +
    "        </tr>\n" +
    "        <tr>\n" +
    "            <td>Parent:</td>\n" +
    "            <td><a href=\"#/images/{{ image.Parent }}/\">{{ image.Parent }}</a></td>\n" +
    "        </tr>\n" +
    "        <tr>\n" +
    "            <td>Size (Virtual Size):</td>\n" +
    "            <td>{{ image.Size|humansize }} ({{ image.VirtualSize|humansize }})</td>\n" +
    "        </tr>\n" +
    "\n" +
    "        <tr>\n" +
    "            <td>Hostname:</td>\n" +
    "            <td>{{ image.ContainerConfig.Hostname }}</td>\n" +
    "        </tr>\n" +
    "        <tr>\n" +
    "            <td>User:</td>\n" +
    "            <td>{{ image.ContainerConfig.User }}</td>\n" +
    "        </tr>\n" +
    "        <tr>\n" +
    "            <td>Cmd:</td>\n" +
    "            <td>{{ image.ContainerConfig.Cmd }}</td>\n" +
    "        </tr>\n" +
    "        <tr>\n" +
    "            <td>Volumes:</td>\n" +
    "            <td>{{ image.ContainerConfig.Volumes }}</td>\n" +
    "        </tr>\n" +
    "        <tr>\n" +
    "            <td>Volumes from:</td>\n" +
    "            <td>{{ image.ContainerConfig.VolumesFrom }}</td>\n" +
    "        </tr>\n" +
    "        <tr>\n" +
    "            <td>Built with:</td>\n" +
    "            <td>Docker {{ image.DockerVersion }} on {{ image.Os}}, {{ image.Architecture }}</td>\n" +
    "        </tr>\n" +
    "\n" +
    "        </tbody>\n" +
    "    </table>\n" +
    "\n" +
    "    <div class=\"row-fluid\">\n" +
    "        <div class=\"span1\">\n" +
    "            History:\n" +
    "        </div>\n" +
    "        <div class=\"span5\">\n" +
    "            <i class=\"icon-refresh\" style=\"width:32px;height:32px;\" ng-click=\"getHistory()\"></i>\n" +
    "        </div>\n" +
    "    </div>\n" +
    "\n" +
    "    <div class=\"well well-large\">\n" +
    "        <ul>\n" +
    "            <li ng-repeat=\"change in history\">\n" +
    "                <strong>{{ change.Id }}</strong>: Created: {{ change.Created|getdate }} Created by: {{ change.CreatedBy\n" +
    "                }}\n" +
    "            </li>\n" +
    "        </ul>\n" +
    "    </div>\n" +
    "\n" +
    "    <hr/>\n" +
    "\n" +
    "    <div class=\"row-fluid\">\n" +
    "        <form class=\"form-inline\" role=\"form\">\n" +
    "            <fieldset>\n" +
    "                <legend>Tag image</legend>\n" +
    "                <div class=\"form-group\">\n" +
    "                    <label>Tag:</label>\n" +
    "                    <input type=\"text\" placeholder=\"repo\" ng-model=\"tagInfo.repo\" class=\"form-control\">\n" +
    "                    <input type=\"text\" placeholder=\"version\" ng-model=\"tagInfo.version\" class=\"form-control\">\n" +
    "                </div>\n" +
    "                <div class=\"form-group\">\n" +
    "                    <label class=\"checkbox\">\n" +
    "                        <input type=\"checkbox\" ng-model=\"tagInfo.force\" class=\"form-control\"/> Force?\n" +
    "                    </label>\n" +
    "                </div>\n" +
    "                <input type=\"button\" ng-click=\"addTag()\" value=\"Add Tag\" class=\"btn btn-primary\"/>\n" +
    "            </fieldset>\n" +
    "        </form>\n" +
    "    </div>\n" +
    "\n" +
    "    <hr/>\n" +
    "\n" +
    "    <div class=\"btn-remove\">\n" +
    "        <button class=\"btn btn-large btn-block btn-primary btn-danger\" ng-click=\"removeImage(id)\">Remove Image</button>\n" +
    "    </div>\n" +
    "</div>\n" +
    "");
}]);

angular.module("app/components/images/images.dup.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("app/components/images/images.dup.html",
    "<div ng-include=\"template\" ng-controller=\"BuilderController\"></div>\n" +
    "<div ng-include=\"template\" ng-controller=\"PullImageController\"></div>\n" +
    "\n" +
    "<h2>Images:</h2>\n" +
    "\n" +
    "<div>\n" +
    "    <ul class=\"nav nav-pills pull-left\">\n" +
    "        <li class=\"dropdown\">\n" +
    "            <a class=\"dropdown-toggle\" id=\"drop4\" role=\"button\" data-toggle=\"dropdown\" data-target=\"#\">Actions <b class=\"caret\"></b></a>\n" +
    "            <ul id=\"menu1\" class=\"dropdown-menu\" role=\"menu\" aria-labelledby=\"drop4\">\n" +
    "                <li><a tabindex=\"-1\" href=\"\" ng-click=\"removeAction()\">Remove</a></li>\n" +
    "            </ul>\n" +
    "        </li>\n" +
    "        <li><a data-toggle=\"modal\" data-target=\"#pull-modal\" href=\"\">Pull</a></li>\n" +
    "    </ul>\n" +
    "\n" +
    "    <div class=\"pull-right form-inline\">\n" +
    "        <input type=\"text\" class=\"form-control\" id=\"filter\" placeholder=\"Filter\" ng-model=\"filter\"/> <label class=\"sr-only\" for=\"filter\">Filter</label>\n" +
    "    </div>\n" +
    "</div>\n" +
    "<table class=\"table table-striped\">\n" +
    "    <thead>\n" +
    "        <tr>\n" +
    "            <th><label><input type=\"checkbox\" ng-model=\"toggle\" ng-change=\"toggleSelectAll()\" /> Select</label></th>\n" +
    "            <th>\n" +
    "                <a href=\"#/images/\" ng-click=\"order('Id')\">\n" +
    "                    Id\n" +
    "                    <span ng-show=\"sortType == 'Id' && !sortReverse\" class=\"glyphicon glyphicon-chevron-down\"></span>\n" +
    "                    <span ng-show=\"sortType == 'Id' && sortReverse\" class=\"glyphicon glyphicon-chevron-up\"></span>\n" +
    "                </a>\n" +
    "            </th>\n" +
    "            <th>\n" +
    "                <a href=\"#/images/\" ng-click=\"order('RepoTags')\">\n" +
    "                    Repository\n" +
    "                    <span ng-show=\"sortType == 'RepoTags' && !sortReverse\" class=\"glyphicon glyphicon-chevron-down\"></span>\n" +
    "                    <span ng-show=\"sortType == 'RepoTags' && sortReverse\" class=\"glyphicon glyphicon-chevron-up\"></span>\n" +
    "                </a>\n" +
    "            </th>\n" +
    "            <th>\n" +
    "                <a href=\"#/images/\" ng-click=\"order('VirtualSize')\">\n" +
    "                    VirtualSize\n" +
    "                    <span ng-show=\"sortType == 'VirtualSize' && !sortReverse\" class=\"glyphicon glyphicon-chevron-down\"></span>\n" +
    "                    <span ng-show=\"sortType == 'VirtualSize' && sortReverse\" class=\"glyphicon glyphicon-chevron-up\"></span>\n" +
    "                </a>\n" +
    "            </th>\n" +
    "            <th>\n" +
    "                <a href=\"#/images/\" ng-click=\"order('Created')\">\n" +
    "                    Created\n" +
    "                    <span ng-show=\"sortType == 'Created' && !sortReverse\" class=\"glyphicon glyphicon-chevron-down\"></span>\n" +
    "                    <span ng-show=\"sortType == 'Created' && sortReverse\" class=\"glyphicon glyphicon-chevron-up\"></span>\n" +
    "                </a>\n" +
    "            </th>\n" +
    "        </tr>\n" +
    "    </thead>\n" +
    "    <tbody>\n" +
    "        <tr ng-repeat=\"image in (filteredImages = (images | filter:filter | orderBy:sortType:sortReverse))\">\n" +
    "            <td><input type=\"checkbox\" ng-model=\"image.Checked\" /></td>\n" +
    "            <td><a href=\"#/images/{{ image.Id }}/?tag={{ image|repotag }}\">{{ image.Id|truncate:20}}</a></td>\n" +
    "            <td>{{ image|repotag }}</td>\n" +
    "            <td>{{ image.VirtualSize|humansize }}</td>\n" +
    "            <td>{{ image.Created|getdate }}</td>\n" +
    "        </tr>\n" +
    "    </tbody>\n" +
    "</table>\n" +
    "");
}]);

angular.module("app/components/images/images.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("app/components/images/images.html",
    "<div class=\"col-lg-12\">\n" +
    "  <rd-widget>\n" +
    "    <rd-widget-header icon=\"fa-tag\" title=\"Images\">\n" +
    "    </rd-widget-header>\n" +
    "    <rd-widget-taskbar classes=\"col-lg-12\">\n" +
    "      <div class=\"pull-left\">\n" +
    "        <div class=\"btn-group\" role=\"group\" aria-label=\"...\">\n" +
    "          <button type=\"button\" class=\"btn btn-default\">Remove</button>\n" +
    "          <button type=\"button\" class=\"btn btn-default\">Pull new image...</button>\n" +
    "        </div>\n" +
    "      </div>\n" +
    "      <div class=\"pull-right\">\n" +
    "        <input type=\"text\" id=\"filter\" ng-model=\"state.filter\" placeholder=\"Filter...\" class=\"form-control input-sm\" />\n" +
    "      </div>\n" +
    "    </rd-widget-taskbar>\n" +
    "    <rd-widget-body classes=\"no-padding\">\n" +
    "      <div class=\"table-responsive\">\n" +
    "        <table class=\"table\">\n" +
    "          <thead>\n" +
    "            <tr>\n" +
    "              <th><label><input type=\"checkbox\" ng-model=\"state.toggle\" ng-change=\"toggleSelectAll()\" /> Select</label></th>\n" +
    "              <th>\n" +
    "                <a href=\"#/images/\" ng-click=\"order('Id')\">\n" +
    "                  Id\n" +
    "                  <span ng-show=\"sortType == 'Id' && !sortReverse\" class=\"glyphicon glyphicon-chevron-down\"></span>\n" +
    "                  <span ng-show=\"sortType == 'Id' && sortReverse\" class=\"glyphicon glyphicon-chevron-up\"></span>\n" +
    "                </a>\n" +
    "              </th>\n" +
    "              <th>\n" +
    "                <a href=\"#/images/\" ng-click=\"order('RepoTags')\">\n" +
    "                  Repository\n" +
    "                  <span ng-show=\"sortType == 'RepoTags' && !sortReverse\" class=\"glyphicon glyphicon-chevron-down\"></span>\n" +
    "                  <span ng-show=\"sortType == 'RepoTags' && sortReverse\" class=\"glyphicon glyphicon-chevron-up\"></span>\n" +
    "                </a>\n" +
    "              </th>\n" +
    "              <th>\n" +
    "                <a href=\"#/images/\" ng-click=\"order('VirtualSize')\">\n" +
    "                  VirtualSize\n" +
    "                  <span ng-show=\"sortType == 'VirtualSize' && !sortReverse\" class=\"glyphicon glyphicon-chevron-down\"></span>\n" +
    "                  <span ng-show=\"sortType == 'VirtualSize' && sortReverse\" class=\"glyphicon glyphicon-chevron-up\"></span>\n" +
    "                </a>\n" +
    "              </th>\n" +
    "              <th>\n" +
    "                <a href=\"#/images/\" ng-click=\"order('Created')\">\n" +
    "                  Created\n" +
    "                  <span ng-show=\"sortType == 'Created' && !sortReverse\" class=\"glyphicon glyphicon-chevron-down\"></span>\n" +
    "                  <span ng-show=\"sortType == 'Created' && sortReverse\" class=\"glyphicon glyphicon-chevron-up\"></span>\n" +
    "                </a>\n" +
    "              </th>\n" +
    "            </tr>\n" +
    "          </thead>\n" +
    "          <tbody>\n" +
    "            <tr ng-repeat=\"image in (state.filteredImages = (images | filter:state.filter | orderBy:sortType:sortReverse))\">\n" +
    "              <td><input type=\"checkbox\" ng-model=\"image.Checked\" /></td>\n" +
    "              <td><a href=\"#/images/{{ image.Id }}/?tag={{ image|repotag }}\">{{ image.Id|truncate:20}}</a></td>\n" +
    "              <td>{{ image|repotag }}</td>\n" +
    "              <td>{{ image.VirtualSize|humansize }}</td>\n" +
    "              <td>{{ image.Created|getdate }}</td>\n" +
    "            </tr>\n" +
    "          </tbody>\n" +
    "        </table>\n" +
    "      </div>\n" +
    "    </rd-widget-body>\n" +
    "  <rd-widget>\n" +
    "</div>\n" +
    "");
}]);

angular.module("app/components/info/info.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("app/components/info/info.html",
    "<div class=\"detail\">\n" +
    "  <h2>Swarm Information</h2>\n" +
    "\n" +
    "  <div>\n" +
    "    <p class=\"lead\">\n" +
    "      <strong>Swarm version: </strong>{{ docker.Version }}<br/>\n" +
    "      <strong>API Version: </strong>{{ docker.ApiVersion }}<br/>\n" +
    "      <strong>Go Version: </strong>{{ docker.GoVersion }}<br/>\n" +
    "    </p>\n" +
    "  </div>\n" +
    "\n" +
    "  <h2>Cluster Information</h2>\n" +
    "  <table class=\"table table-striped\">\n" +
    "    <tbody>\n" +
    "      <tr>\n" +
    "        <td>Nodes:</td>\n" +
    "        <td>{{ swarm.Nodes }}</td>\n" +
    "      </tr>\n" +
    "      <tr>\n" +
    "        <td>Containers:</td>\n" +
    "        <td>{{ info.Containers }}</td>\n" +
    "      </tr>\n" +
    "      <tr>\n" +
    "        <td>Images:</td>\n" +
    "        <td>{{ info.Images }}</td>\n" +
    "      </tr>\n" +
    "      <tr>\n" +
    "        <td>Strategy:</td>\n" +
    "        <td>{{ swarm.Strategy }}</td>\n" +
    "      </tr>\n" +
    "      <tr>\n" +
    "        <td>CPUs:</td>\n" +
    "        <td>{{ info.NCPU }}</td>\n" +
    "      </tr>\n" +
    "      <tr>\n" +
    "        <td>Total Memory:</td>\n" +
    "        <td>{{ info.MemTotal|humansize }}</td>\n" +
    "      </tr>\n" +
    "      <tr>\n" +
    "        <td>Operating System:</td>\n" +
    "        <td>{{ info.OperatingSystem }}</td>\n" +
    "      </tr>\n" +
    "      <tr>\n" +
    "        <td>Kernel Version:</td>\n" +
    "        <td>{{ info.KernelVersion }}</td>\n" +
    "      </tr>\n" +
    "    </tbody>\n" +
    "  </table>\n" +
    "\n" +
    "  <h2>Nodes Information</h2>\n" +
    "  <table class=\"table table-striped\">\n" +
    "    <thead>\n" +
    "      <th>Name</th>\n" +
    "      <th>IP</th>\n" +
    "      <th>Containers</th>\n" +
    "      <th>Status</th>\n" +
    "    </thead>\n" +
    "    <tbody>\n" +
    "      <tr ng-repeat=\"node in swarm.Status\">\n" +
    "        <td>{{ node.name }}</td>\n" +
    "        <td>{{ node.ip }}</td>\n" +
    "        <td>{{ node.containers }}</td>\n" +
    "        <td><span class=\"label label-{{ node.status|statusbadge }}\">{{ node.status }}</span></td>\n" +
    "      </tr>\n" +
    "    </tbody>\n" +
    "  </table>\n" +
    "</div>\n" +
    "");
}]);

angular.module("app/components/masthead/masthead.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("app/components/masthead/masthead.html",
    "<div class=\"masthead\">\n" +
    "    <h3 class=\"text-muted\">UI For Docker</h3>\n" +
    "\n" +
    "    <div class=\"col-xs-11\">\n" +
    "        <ul class=\"nav well\">\n" +
    "            <li><a href=\"#/\">Dashboard</a></li>\n" +
    "            <li><a href=\"#/containers/\">Containers</a></li>\n" +
    "            <li><a href=\"#/containers_network/\">Containers Network</a></li>\n" +
    "            <li><a href=\"#/images/\">Images</a></li>\n" +
    "            <li ng-if=\"showNetworksVolumes\"><a href=\"#/networks/\">Networks</a></li>\n" +
    "            <li ng-if=\"showNetworksVolumes\"><a href=\"#/volumes/\">Volumes</a></li>\n" +
    "            <li><a href=\"#/info/\">Swarm</a></li>\n" +
    "        </ul>\n" +
    "    </div>\n" +
    "    <div class=\"col-xs-1\">\n" +
    "        <button class=\"btn btn-primary\" ng-click=\"refresh()\">\n" +
    "            <span class=\"glyphicon glyphicon-refresh\" aria-hidden=\"true\"></span>\n" +
    "            Refresh\n" +
    "        </button>\n" +
    "    </div>\n" +
    "</div>\n" +
    "");
}]);

angular.module("app/components/network/network.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("app/components/network/network.html",
    "<div class=\"detail\">\n" +
    "\n" +
    "    <h4>Network: {{ network.Name }}</h4>\n" +
    "\n" +
    "    <table class=\"table table-striped\">\n" +
    "        <tbody>\n" +
    "        <tr>\n" +
    "            <td>Name:</td>\n" +
    "            <td>{{ network.Name }}</td>\n" +
    "        </tr>\n" +
    "        <tr>\n" +
    "            <td>Id:</td>\n" +
    "            <td>{{ network.Id }}</td>\n" +
    "        </tr>\n" +
    "        <tr>\n" +
    "            <td>Scope:</td>\n" +
    "            <td>{{ network.Scope }}</td>\n" +
    "        </tr>\n" +
    "        <tr>\n" +
    "            <td>Driver:</td>\n" +
    "            <td>{{ network.Driver }}</td>\n" +
    "        </tr>\n" +
    "        <tr>\n" +
    "            <td>IPAM:</td>\n" +
    "            <td>\n" +
    "                <table class=\"table table-striped\">\n" +
    "                    <tr>\n" +
    "                        <td>Driver:</td>\n" +
    "                        <td>{{ network.IPAM.Driver }}</td>\n" +
    "                    </tr>\n" +
    "                    <tr>\n" +
    "                        <td>Subnet:</td>\n" +
    "                        <td>{{ network.IPAM.Config[0].Subnet }}</td>\n" +
    "                    </tr>\n" +
    "                    <tr>\n" +
    "                        <td>Gateway:</td>\n" +
    "                        <td>{{ network.IPAM.Config[0].Gateway }}</td>\n" +
    "                    </tr>\n" +
    "                </table>\n" +
    "            </td>\n" +
    "        </tr>\n" +
    "        <tr>\n" +
    "            <td>Containers:</td>\n" +
    "            <td>\n" +
    "                <table class=\"table table-striped\" ng-repeat=\"(Id, container) in network.Containers\">\n" +
    "                    <tr>\n" +
    "                        <td>Id:</td>\n" +
    "                        <td><a href=\"#/containers/{{ Id }}\">{{ Id }}</a></td>\n" +
    "                        <td>\n" +
    "                            <button ng-click=\"disconnect(network.Id, Id)\" class=\"btn btn-danger btn-sm\">\n" +
    "                                Disconnect from network\n" +
    "                            </button>\n" +
    "                        </td>\n" +
    "                    </tr>\n" +
    "                    <tr>\n" +
    "                        <td>EndpointID:</td>\n" +
    "                        <td>{{ container.EndpointID}}</td>\n" +
    "                    </tr>\n" +
    "                    <tr>\n" +
    "                        <td>MacAddress:</td>\n" +
    "                        <td>{{ container.MacAddress}}</td>\n" +
    "                    </tr>\n" +
    "                    <tr>\n" +
    "                        <td>IPv4Address:</td>\n" +
    "                        <td>{{ container.IPv4Address}}</td>\n" +
    "                    </tr>\n" +
    "                    <tr>\n" +
    "                        <td>IPv6Address:</td>\n" +
    "                        <td>{{ container.IPv6Address}}</td>\n" +
    "                    </tr>\n" +
    "                </table>\n" +
    "                <form class=\"form-inline\">\n" +
    "                    <div class=\"form-group\">\n" +
    "                        <label>Container ID:\n" +
    "                            <input ng-model=\"containerId\" placeholder=\"3613f73ba0e4\" class=\"form-control\">\n" +
    "                        </label>\n" +
    "                    </div>\n" +
    "                    <button ng-click=\"connect(network.Id, containerId)\" class=\"btn btn-primary\">\n" +
    "                        Connect\n" +
    "                    </button>\n" +
    "                </form>\n" +
    "            </td>\n" +
    "        </tr>\n" +
    "        <tr>\n" +
    "            <td>Options:</td>\n" +
    "            <td>\n" +
    "                <table role=\"table\" class=\"table table-striped\">\n" +
    "                    <tr>\n" +
    "                        <th>Key</th>\n" +
    "                        <th>Value</th>\n" +
    "                    </tr>\n" +
    "                    <tr ng-repeat=\"(k, v) in network.Options\">\n" +
    "                        <td>{{ k }}</td>\n" +
    "                        <td>{{ v }}</td>\n" +
    "                    </tr>\n" +
    "                </table>\n" +
    "            </td>\n" +
    "        </tr>\n" +
    "        </tbody>\n" +
    "    </table>\n" +
    "\n" +
    "\n" +
    "    <hr/>\n" +
    "\n" +
    "\n" +
    "    <div class=\"btn-remove\">\n" +
    "        <button class=\"btn btn-large btn-block btn-primary btn-danger\" ng-click=\"removeImage(id)\">Remove Network\n" +
    "        </button>\n" +
    "    </div>\n" +
    "</div>");
}]);

angular.module("app/components/networks/networks.dup.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("app/components/networks/networks.dup.html",
    "<h2>Networks:</h2>\n" +
    "\n" +
    "<div>\n" +
    "    <ul class=\"nav nav-pills pull-left\">\n" +
    "        <li class=\"dropdown\">\n" +
    "            <a class=\"dropdown-toggle\" id=\"drop4\" role=\"button\" data-toggle=\"dropdown\" data-target=\"#\">Actions <b\n" +
    "                    class=\"caret\"></b></a>\n" +
    "            <ul id=\"menu1\" class=\"dropdown-menu\" role=\"menu\" aria-labelledby=\"drop4\">\n" +
    "                <li><a tabindex=\"-1\" href=\"\" ng-click=\"removeAction()\">Remove</a></li>\n" +
    "            </ul>\n" +
    "        </li>\n" +
    "    </ul>\n" +
    "\n" +
    "    <div class=\"pull-right form-inline\">\n" +
    "        <input type=\"text\" class=\"form-control\" id=\"filter\" placeholder=\"Filter\" ng-model=\"filter\"/> <label\n" +
    "            class=\"sr-only\" for=\"filter\">Filter</label>\n" +
    "    </div>\n" +
    "</div>\n" +
    "<table class=\"table table-striped\">\n" +
    "    <thead>\n" +
    "    <tr>\n" +
    "        <th><label><input type=\"checkbox\" ng-model=\"toggle\" ng-change=\"toggleSelectAll()\"/> Select</label></th>\n" +
    "        <th>\n" +
    "            <a href=\"#/networks/\" ng-click=\"order('Name')\">\n" +
    "                Name\n" +
    "                <span ng-show=\"sortType == 'Name' && !sortReverse\" class=\"glyphicon glyphicon-chevron-down\"></span>\n" +
    "                <span ng-show=\"sortType == 'Name' && sortReverse\" class=\"glyphicon glyphicon-chevron-up\"></span>\n" +
    "            </a>\n" +
    "        </th>\n" +
    "        <th>\n" +
    "            <a href=\"#/networks/\" ng-click=\"order('Id')\">\n" +
    "                Id\n" +
    "                <span ng-show=\"sortType == 'Id' && !sortReverse\" class=\"glyphicon glyphicon-chevron-down\"></span>\n" +
    "                <span ng-show=\"sortType == 'Id' && sortReverse\" class=\"glyphicon glyphicon-chevron-up\"></span>\n" +
    "            </a>\n" +
    "        </th>\n" +
    "        <th>\n" +
    "            <a href=\"#/networks/\" ng-click=\"order('Scope')\">\n" +
    "                Scope\n" +
    "                <span ng-show=\"sortType == 'Scope' && !sortReverse\" class=\"glyphicon glyphicon-chevron-down\"></span>\n" +
    "                <span ng-show=\"sortType == 'Scope' && sortReverse\" class=\"glyphicon glyphicon-chevron-up\"></span>\n" +
    "            </a>\n" +
    "        </th>\n" +
    "        <th>\n" +
    "            <a href=\"#/networks/\" ng-click=\"order('Driver')\">\n" +
    "                Driver\n" +
    "                <span ng-show=\"sortType == 'Driver' && !sortReverse\" class=\"glyphicon glyphicon-chevron-down\"></span>\n" +
    "                <span ng-show=\"sortType == 'Driver' && sortReverse\" class=\"glyphicon glyphicon-chevron-up\"></span>\n" +
    "            </a>\n" +
    "        </th>\n" +
    "        <th>\n" +
    "            <a href=\"#/networks/\" ng-click=\"order('IPAM.Driver')\">\n" +
    "                IPAM Driver\n" +
    "                <span ng-show=\"sortType == 'IPAM.Driver' && !sortReverse\" class=\"glyphicon glyphicon-chevron-down\"></span>\n" +
    "                <span ng-show=\"sortType == 'IPAM.Driver' && sortReverse\" class=\"glyphicon glyphicon-chevron-up\"></span>\n" +
    "            </a>\n" +
    "        </th>\n" +
    "        <th>\n" +
    "            <a href=\"#/networks/\" ng-click=\"order('IPAM.Config[0].Subnet')\">\n" +
    "                IPAM Subnet\n" +
    "                <span ng-show=\"sortType == 'IPAM.Config[0].Subnet' && !sortReverse\" class=\"glyphicon glyphicon-chevron-down\"></span>\n" +
    "                <span ng-show=\"sortType == 'IPAM.Config[0].Subnet' && sortReverse\" class=\"glyphicon glyphicon-chevron-up\"></span>\n" +
    "            </a>\n" +
    "        </th>\n" +
    "        <th>\n" +
    "            <a href=\"#/networks/\" ng-click=\"order('IPAM.Config[0].Gateway')\">\n" +
    "                IPAM Gateway\n" +
    "                <span ng-show=\"sortType == 'IPAM.Config[0].Gateway' && !sortReverse\" class=\"glyphicon glyphicon-chevron-down\"></span>\n" +
    "                <span ng-show=\"sortType == 'IPAM.Config[0].Gateway' && sortReverse\" class=\"glyphicon glyphicon-chevron-up\"></span>\n" +
    "            </a>\n" +
    "        </th>\n" +
    "    </tr>\n" +
    "    </thead>\n" +
    "    <tbody>\n" +
    "    <tr ng-repeat=\"network in ( filteredNetworks = (networks | filter:filter | orderBy:sortType:sortReverse))\">\n" +
    "        <td><input type=\"checkbox\" ng-model=\"network.Checked\"/></td>\n" +
    "        <td><a href=\"#/networks/{{ network.Id }}/\">{{ network.Name|truncate:20}}</a></td>\n" +
    "        <td>{{ network.Id }}</td>\n" +
    "        <td>{{ network.Scope }}</td>\n" +
    "        <td>{{ network.Driver }}</td>\n" +
    "        <td>{{ network.IPAM.Driver }}</td>\n" +
    "        <td>{{ network.IPAM.Config[0].Subnet }}</td>\n" +
    "        <td>{{ network.IPAM.Config[0].Gateway }}</td>\n" +
    "    </tr>\n" +
    "    </tbody>\n" +
    "</table>\n" +
    "<div class=\"row\">\n" +
    "    <div class=\"col-xs-offset-3 col-xs-6\">\n" +
    "        <form role=\"form\" class=\"\">\n" +
    "            <div class=\"form-group\">\n" +
    "                <label>Name:</label>\n" +
    "                <input type=\"text\" placeholder='isolated_nw'\n" +
    "                       ng-model=\"createNetworkConfig.Name\" class=\"form-control\"/>\n" +
    "            </div>\n" +
    "            <div class=\"form-group\">\n" +
    "                <label>Driver:</label>\n" +
    "                <input type=\"text\" placeholder='bridge'\n" +
    "                       ng-model=\"createNetworkConfig.Driver\" class=\"form-control\"/>\n" +
    "            </div>\n" +
    "            <div class=\"form-group\">\n" +
    "                <label>Subnet:</label>\n" +
    "                <input type=\"text\" placeholder='172.20.0.0/16'\n" +
    "                       ng-model=\"createNetworkConfig.IPAM.Config[0].Subnet\" class=\"form-control\"/>\n" +
    "            </div>\n" +
    "            <div class=\"form-group\">\n" +
    "                <label>IPRange:</label>\n" +
    "                <input type=\"text\" placeholder='172.20.10.0/24'\n" +
    "                       ng-model=\"createNetworkConfig.IPAM.Config[0].IPRange\" class=\"form-control\"/>\n" +
    "            </div>\n" +
    "            <div class=\"form-group\">\n" +
    "                <label>Gateway:</label>\n" +
    "                <input type=\"text\" placeholder='172.20.10.11'\n" +
    "                       ng-model=\"createNetworkConfig.IPAM.Config[0].Gateway\" class=\"form-control\"/>\n" +
    "            </div>\n" +
    "            <button type=\"button\" class=\"btn btn-success btn-sm\"\n" +
    "                    ng-click=\"addNetwork(createNetworkConfig)\">\n" +
    "                Create Network\n" +
    "            </button>\n" +
    "        </form>\n" +
    "    </div>\n" +
    "</div>");
}]);

angular.module("app/components/networks/networks.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("app/components/networks/networks.html",
    "<div class=\"col-lg-12\">\n" +
    "  <rd-widget>\n" +
    "    <rd-widget-header icon=\"fa-sitemap\" title=\"Networks\">\n" +
    "    </rd-widget-header>\n" +
    "    <rd-widget-taskbar classes=\"col-lg-12\">\n" +
    "      <div class=\"pull-left\">\n" +
    "        <div class=\"btn-group\" role=\"group\" aria-label=\"...\">\n" +
    "          <button type=\"button\" class=\"btn btn-default\">Remove</button>\n" +
    "          <button type=\"button\" class=\"btn btn-default\">Create new network...</button>\n" +
    "        </div>\n" +
    "      </div>\n" +
    "      <div class=\"pull-right\">\n" +
    "        <input type=\"text\" id=\"filter\" ng-model=\"state.filter\" placeholder=\"Filter...\" class=\"form-control input-sm\" />\n" +
    "      </div>\n" +
    "    </rd-widget-taskbar>\n" +
    "    <rd-widget-body classes=\"no-padding\">\n" +
    "      <div class=\"table-responsive\">\n" +
    "        <table class=\"table\">\n" +
    "          <thead>\n" +
    "            <tr>\n" +
    "              <th><label><input type=\"checkbox\" ng-model=\"state.toggle\" ng-change=\"toggleSelectAll()\"/> Select</label></th>\n" +
    "              <th>\n" +
    "                <a href=\"#/networks/\" ng-click=\"order('Name')\">\n" +
    "                  Name\n" +
    "                  <span ng-show=\"sortType == 'Name' && !sortReverse\" class=\"glyphicon glyphicon-chevron-down\"></span>\n" +
    "                  <span ng-show=\"sortType == 'Name' && sortReverse\" class=\"glyphicon glyphicon-chevron-up\"></span>\n" +
    "                </a>\n" +
    "              </th>\n" +
    "              <th>\n" +
    "                <a href=\"#/networks/\" ng-click=\"order('Id')\">\n" +
    "                  Id\n" +
    "                  <span ng-show=\"sortType == 'Id' && !sortReverse\" class=\"glyphicon glyphicon-chevron-down\"></span>\n" +
    "                  <span ng-show=\"sortType == 'Id' && sortReverse\" class=\"glyphicon glyphicon-chevron-up\"></span>\n" +
    "                </a>\n" +
    "              </th>\n" +
    "              <th>\n" +
    "                <a href=\"#/networks/\" ng-click=\"order('Scope')\">\n" +
    "                  Scope\n" +
    "                  <span ng-show=\"sortType == 'Scope' && !sortReverse\" class=\"glyphicon glyphicon-chevron-down\"></span>\n" +
    "                  <span ng-show=\"sortType == 'Scope' && sortReverse\" class=\"glyphicon glyphicon-chevron-up\"></span>\n" +
    "                </a>\n" +
    "              </th>\n" +
    "              <th>\n" +
    "                <a href=\"#/networks/\" ng-click=\"order('Driver')\">\n" +
    "                  Driver\n" +
    "                  <span ng-show=\"sortType == 'Driver' && !sortReverse\" class=\"glyphicon glyphicon-chevron-down\"></span>\n" +
    "                  <span ng-show=\"sortType == 'Driver' && sortReverse\" class=\"glyphicon glyphicon-chevron-up\"></span>\n" +
    "                </a>\n" +
    "              </th>\n" +
    "              <th>\n" +
    "                <a href=\"#/networks/\" ng-click=\"order('IPAM.Driver')\">\n" +
    "                  IPAM Driver\n" +
    "                  <span ng-show=\"sortType == 'IPAM.Driver' && !sortReverse\" class=\"glyphicon glyphicon-chevron-down\"></span>\n" +
    "                  <span ng-show=\"sortType == 'IPAM.Driver' && sortReverse\" class=\"glyphicon glyphicon-chevron-up\"></span>\n" +
    "                </a>\n" +
    "              </th>\n" +
    "              <th>\n" +
    "                <a href=\"#/networks/\" ng-click=\"order('IPAM.Config[0].Subnet')\">\n" +
    "                  IPAM Subnet\n" +
    "                  <span ng-show=\"sortType == 'IPAM.Config[0].Subnet' && !sortReverse\" class=\"glyphicon glyphicon-chevron-down\"></span>\n" +
    "                  <span ng-show=\"sortType == 'IPAM.Config[0].Subnet' && sortReverse\" class=\"glyphicon glyphicon-chevron-up\"></span>\n" +
    "                </a>\n" +
    "              </th>\n" +
    "              <th>\n" +
    "                <a href=\"#/networks/\" ng-click=\"order('IPAM.Config[0].Gateway')\">\n" +
    "                  IPAM Gateway\n" +
    "                  <span ng-show=\"sortType == 'IPAM.Config[0].Gateway' && !sortReverse\" class=\"glyphicon glyphicon-chevron-down\"></span>\n" +
    "                  <span ng-show=\"sortType == 'IPAM.Config[0].Gateway' && sortReverse\" class=\"glyphicon glyphicon-chevron-up\"></span>\n" +
    "                </a>\n" +
    "              </th>\n" +
    "            </tr>\n" +
    "          </thead>\n" +
    "          <tbody>\n" +
    "            <tr ng-repeat=\"network in ( state.filteredNetworks = (networks | filter:state.filter | orderBy:sortType:sortReverse))\">\n" +
    "              <td><input type=\"checkbox\" ng-model=\"network.Checked\"/></td>\n" +
    "              <td><a href=\"#/networks/{{ network.Id }}/\">{{ network.Name|truncate:20}}</a></td>\n" +
    "              <td>{{ network.Id }}</td>\n" +
    "              <td>{{ network.Scope }}</td>\n" +
    "              <td>{{ network.Driver }}</td>\n" +
    "              <td>{{ network.IPAM.Driver }}</td>\n" +
    "              <td>{{ network.IPAM.Config[0].Subnet }}</td>\n" +
    "              <td>{{ network.IPAM.Config[0].Gateway }}</td>\n" +
    "            </tr>\n" +
    "          </tbody>\n" +
    "        </table>\n" +
    "      </div>\n" +
    "    </rd-widget-body>\n" +
    "  <rd-widget>\n" +
    "</div>\n" +
    "");
}]);

angular.module("app/components/pullImage/pullImage.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("app/components/pullImage/pullImage.html",
    "<div id=\"pull-modal\" class=\"modal fade\">\n" +
    "    <div class=\"modal-dialog\">\n" +
    "        <div class=\"modal-content\">\n" +
    "            <div class=\"modal-header\">\n" +
    "                <button type=\"button\" class=\"close\" data-dismiss=\"modal\" aria-hidden=\"true\">&times;</button>\n" +
    "                <h3>Pull Image</h3>\n" +
    "            </div>\n" +
    "            <div class=\"modal-body\">\n" +
    "                <form novalidate role=\"form\" name=\"pullForm\">\n" +
    "                    <!--<div class=\"input-group\">\n" +
    "                        <span class=\"input-group-addon\" id=\"basic-addon1\">Image name</span>\n" +
    "                        <input type=\"text\" class=\"form-control\" placeholder=\"imageName\" aria-describedby=\"basic-addon1\">\n" +
    "                    </div>-->\n" +
    "                    <div class=\"form-group\">\n" +
    "                        <label>Registry:</label>\n" +
    "                        <input type=\"text\" ng-model=\"config.registry\" class=\"form-control\"\n" +
    "                               placeholder=\"Registry. Leave empty to user docker hub\"/>\n" +
    "                    </div>\n" +
    "                    <div class=\"form-group\">\n" +
    "                        <label>Repo:</label>\n" +
    "                        <input type=\"text\" ng-model=\"config.repo\" class=\"form-control\"\n" +
    "                               placeholder=\"Repository - usually your username.\"/>\n" +
    "                    </div>\n" +
    "                    <div class=\"form-group\">\n" +
    "                        <label>Image Name:</label>\n" +
    "                        <input type=\"text\" ng-model=\"config.fromImage\" class=\"form-control\" placeholder=\"Image name\"\n" +
    "                               required/>\n" +
    "                    </div>\n" +
    "                    <div class=\"form-group\">\n" +
    "                        <label>Tag Name:</label>\n" +
    "                        <input type=\"text\" ng-model=\"config.tag\" class=\"form-control\"\n" +
    "                               placeholder=\"Tag name. If empty it will download ALL tags.\"/>\n" +
    "                    </div>\n" +
    "                </form>\n" +
    "            </div>\n" +
    "            <div class=\"alert alert-error\" id=\"error-message\" style=\"display:none\">\n" +
    "                {{ error }}\n" +
    "            </div>\n" +
    "            <div class=\"modal-footer\">\n" +
    "                <a href=\"\" class=\"btn btn-primary\" ng-click=\"pull()\">Pull</a>\n" +
    "            </div>\n" +
    "        </div>\n" +
    "    </div>\n" +
    "</div>\n" +
    "");
}]);

angular.module("app/components/sidebar/sidebar.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("app/components/sidebar/sidebar.html",
    "<div class=\"well\">\n" +
    "    <strong>Running containers:</strong>\n" +
    "    <br/>\n" +
    "    <strong>Endpoint: </strong>{{ endpoint }}\n" +
    "    <ul>\n" +
    "        <li ng-repeat=\"container in containers\">\n" +
    "            <a href=\"#/containers/{{ container.Id }}/\">{{ container.Id|truncate:20 }}</a>\n" +
    "            <span class=\"pull-right label label-{{ container.Status|statusbadge }}\">{{ container.Status }}</span>\n" +
    "        </li>\n" +
    "    </ul>\n" +
    "</div> \n" +
    "");
}]);

angular.module("app/components/startContainer/startcontainer.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("app/components/startContainer/startcontainer.html",
    "<div id=\"create-modal\" class=\"modal fade\">\n" +
    "    <div class=\"modal-dialog\">\n" +
    "        <div class=\"modal-content\">\n" +
    "            <div class=\"modal-header\">\n" +
    "                <button type=\"button\" class=\"close\" data-dismiss=\"modal\" aria-hidden=\"true\">&times;</button>\n" +
    "                <h3>Create And Start Container From Image</h3>\n" +
    "            </div>\n" +
    "            <div class=\"modal-body\">\n" +
    "                <form role=\"form\">\n" +
    "                    <accordion close-others=\"true\">\n" +
    "                        <accordion-group heading=\"Container options\" is-open=\"menuStatus.containerOpen\">\n" +
    "                            <fieldset>\n" +
    "                                <div class=\"row\">\n" +
    "                                    <div class=\"col-xs-6\">\n" +
    "                                        <div class=\"form-group\">\n" +
    "                                            <label>Cmd:</label>\n" +
    "                                            <input type=\"text\" placeholder='[\"/bin/echo\", \"Hello world\"]'\n" +
    "                                                   ng-model=\"config.Cmd\" class=\"form-control\"/>\n" +
    "                                            <small>Input commands as a raw string or JSON array</small>\n" +
    "                                        </div>\n" +
    "                                        <div class=\"form-group\">\n" +
    "                                            <label>Entrypoint:</label>\n" +
    "                                            <input type=\"text\" ng-model=\"config.Entrypoint\" class=\"form-control\"\n" +
    "                                                   placeholder=\"./entrypoint.sh\"/>\n" +
    "                                        </div>\n" +
    "                                        <div class=\"form-group\">\n" +
    "                                            <label>Name:</label>\n" +
    "                                            <input type=\"text\" ng-model=\"config.name\" class=\"form-control\"/>\n" +
    "                                        </div>\n" +
    "                                        <div class=\"form-group\">\n" +
    "                                            <label>Hostname:</label>\n" +
    "                                            <input type=\"text\" ng-model=\"config.Hostname\" class=\"form-control\"/>\n" +
    "                                        </div>\n" +
    "                                        <div class=\"form-group\">\n" +
    "                                            <label>Domainname:</label>\n" +
    "                                            <input type=\"text\" ng-model=\"config.Domainname\" class=\"form-control\"/>\n" +
    "                                        </div>\n" +
    "                                        <div class=\"form-group\">\n" +
    "                                            <label>User:</label>\n" +
    "                                            <input type=\"text\" ng-model=\"config.User\" class=\"form-control\"/>\n" +
    "                                        </div>\n" +
    "                                        <div class=\"form-group\">\n" +
    "                                            <label>Memory:</label>\n" +
    "                                            <input type=\"number\" ng-model=\"config.Memory\" class=\"form-control\"/>\n" +
    "                                        </div>\n" +
    "                                        <div class=\"form-group\">\n" +
    "                                            <label>Volumes:</label>\n" +
    "\n" +
    "                                            <div ng-repeat=\"volume in config.Volumes\">\n" +
    "                                                <div class=\"form-group form-inline\">\n" +
    "                                                    <input type=\"text\" ng-model=\"volume.name\" class=\"form-control\"\n" +
    "                                                           placeholder=\"/var/data\"/>\n" +
    "                                                    <button type=\"button\" class=\"btn btn-danger btn-sm\"\n" +
    "                                                            ng-click=\"rmEntry(config.Volumes, volume)\">Remove\n" +
    "                                                    </button>\n" +
    "                                                </div>\n" +
    "                                            </div>\n" +
    "                                            <button type=\"button\" class=\"btn btn-success btn-sm\"\n" +
    "                                                    ng-click=\"addEntry(config.Volumes, {name: ''})\">Add Volume\n" +
    "                                            </button>\n" +
    "                                        </div>\n" +
    "                                    </div>\n" +
    "                                    <div class=\"col-xs-6\">\n" +
    "                                        <div class=\"form-group\">\n" +
    "                                            <label>MemorySwap:</label>\n" +
    "                                            <input type=\"number\" ng-model=\"config.MemorySwap\" class=\"form-control\"/>\n" +
    "                                        </div>\n" +
    "                                        <div class=\"form-group\">\n" +
    "                                            <label>CpuShares:</label>\n" +
    "                                            <input type=\"number\" ng-model=\"config.CpuShares\" class=\"form-control\"/>\n" +
    "                                        </div>\n" +
    "                                        <div class=\"form-group\">\n" +
    "                                            <label>Cpuset:</label>\n" +
    "                                            <input type=\"text\" ng-model=\"config.Cpuset\" class=\"form-control\"\n" +
    "                                                   placeholder=\"1,2\"/>\n" +
    "                                            <small>Input as comma-separated list of numbers</small>\n" +
    "                                        </div>\n" +
    "                                        <div class=\"form-group\">\n" +
    "                                            <label>WorkingDir:</label>\n" +
    "                                            <input type=\"text\" ng-model=\"config.WorkingDir\" class=\"form-control\"\n" +
    "                                                   placeholder=\"/app\"/>\n" +
    "                                        </div>\n" +
    "                                        <div class=\"form-group\">\n" +
    "                                            <label>MacAddress:</label>\n" +
    "                                            <input type=\"text\" ng-model=\"config.MacAddress\" class=\"form-control\"\n" +
    "                                                   placeholder=\"12:34:56:78:9a:bc\"/>\n" +
    "                                        </div>\n" +
    "                                        <div class=\"form-group\">\n" +
    "                                            <label for=\"networkDisabled\">NetworkDisabled:</label>\n" +
    "                                            <input id=\"networkDisabled\" type=\"checkbox\"\n" +
    "                                                   ng-model=\"config.NetworkDisabled\"/>\n" +
    "                                        </div>\n" +
    "                                        <div class=\"form-group\">\n" +
    "                                            <label for=\"tty\">Tty:</label>\n" +
    "                                            <input id=\"tty\" type=\"checkbox\" ng-model=\"config.Tty\"/>\n" +
    "                                        </div>\n" +
    "                                        <div class=\"form-group\">\n" +
    "                                            <label for=\"openStdin\">OpenStdin:</label>\n" +
    "                                            <input id=\"openStdin\" type=\"checkbox\" ng-model=\"config.OpenStdin\"/>\n" +
    "                                        </div>\n" +
    "                                        <div class=\"form-group\">\n" +
    "                                            <label for=\"stdinOnce\">StdinOnce:</label>\n" +
    "                                            <input id=\"stdinOnce\" type=\"checkbox\" ng-model=\"config.StdinOnce\"/>\n" +
    "                                        </div>\n" +
    "                                        <div class=\"form-group\">\n" +
    "                                            <label>SecurityOpts:</label>\n" +
    "\n" +
    "                                            <div ng-repeat=\"opt in config.SecurityOpts\">\n" +
    "                                                <div class=\"form-group form-inline\">\n" +
    "                                                    <input type=\"text\" ng-model=\"opt.name\" class=\"form-control\"\n" +
    "                                                           placeholder=\"label:type:svirt_apache\"/>\n" +
    "                                                    <button type=\"button\" class=\"btn btn-danger btn-sm\"\n" +
    "                                                            ng-click=\"rmEntry(config.SecurityOpts, opt)\">Remove\n" +
    "                                                    </button>\n" +
    "                                                </div>\n" +
    "                                            </div>\n" +
    "                                            <button type=\"button\" class=\"btn btn-success btn-sm\"\n" +
    "                                                    ng-click=\"addEntry(config.SecurityOpts, {name: ''})\">Add Option\n" +
    "                                            </button>\n" +
    "                                        </div>\n" +
    "                                    </div>\n" +
    "                                </div>\n" +
    "                                <hr>\n" +
    "                                <div class=\"form-group\">\n" +
    "                                    <label>Env:</label>\n" +
    "\n" +
    "                                    <div ng-repeat=\"envar in config.Env\">\n" +
    "                                        <div class=\"form-group form-inline\">\n" +
    "                                            <div class=\"form-group\">\n" +
    "                                                <label class=\"sr-only\">Variable Name:</label>\n" +
    "                                                <input type=\"text\" ng-model=\"envar.name\" class=\"form-control\"\n" +
    "                                                       placeholder=\"NAME\"/>\n" +
    "                                            </div>\n" +
    "                                            <div class=\"form-group\">\n" +
    "                                                <label class=\"sr-only\">Variable Value:</label>\n" +
    "                                                <input type=\"text\" ng-model=\"envar.value\" class=\"form-control\"\n" +
    "                                                       placeholder=\"value\"/>\n" +
    "                                            </div>\n" +
    "                                            <div class=\"form-group\">\n" +
    "                                                <button class=\"btn btn-danger btn-xs form-control\"\n" +
    "                                                        ng-click=\"rmEntry(config.Env, envar)\">Remove\n" +
    "                                                </button>\n" +
    "                                            </div>\n" +
    "                                        </div>\n" +
    "                                    </div>\n" +
    "                                    <button type=\"button\" class=\"btn btn-success btn-sm\"\n" +
    "                                            ng-click=\"addEntry(config.Env, {name: '', value: ''})\">Add environment\n" +
    "                                        variable\n" +
    "                                    </button>\n" +
    "                                </div>\n" +
    "                                <div class=\"form-group\">\n" +
    "                                    <label>Labels:</label>\n" +
    "\n" +
    "                                    <div ng-repeat=\"label in config.Labels\">\n" +
    "                                        <div class=\"form-group form-inline\">\n" +
    "                                            <div class=\"form-group\">\n" +
    "                                                <label class=\"sr-only\">Key:</label>\n" +
    "                                                <input type=\"text\" ng-model=\"label.key\" class=\"form-control\"\n" +
    "                                                       placeholder=\"key\"/>\n" +
    "                                            </div>\n" +
    "                                            <div class=\"form-group\">\n" +
    "                                                <label class=\"sr-only\">Value:</label>\n" +
    "                                                <input type=\"text\" ng-model=\"label.value\" class=\"form-control\"\n" +
    "                                                       placeholder=\"value\"/>\n" +
    "                                            </div>\n" +
    "                                            <div class=\"form-group\">\n" +
    "                                                <button class=\"btn btn-danger btn-xs form-control\"\n" +
    "                                                        ng-click=\"rmEntry(config.Labels, label)\">Remove\n" +
    "                                                </button>\n" +
    "                                            </div>\n" +
    "                                        </div>\n" +
    "                                    </div>\n" +
    "                                    <button type=\"button\" class=\"btn btn-success btn-sm\"\n" +
    "                                            ng-click=\"addEntry(config.Labels, {key: '', value: ''})\">Add Label\n" +
    "                                    </button>\n" +
    "                                </div>\n" +
    "                            </fieldset>\n" +
    "                        </accordion-group>\n" +
    "                        <accordion-group heading=\"HostConfig options\" is-open=\"menuStatus.hostConfigOpen\">\n" +
    "                            <fieldset>\n" +
    "                                <div class=\"row\">\n" +
    "                                    <div class=\"col-xs-6\">\n" +
    "                                        <div class=\"form-group\">\n" +
    "                                            <label>Binds:</label>\n" +
    "\n" +
    "                                            <div ng-repeat=\"bind in config.HostConfig.Binds\">\n" +
    "                                                <div class=\"form-group form-inline\">\n" +
    "                                                    <input type=\"text\" ng-model=\"bind.name\" class=\"form-control\"\n" +
    "                                                           placeholder=\"/host:/container\"/>\n" +
    "                                                    <button type=\"button\" class=\"btn btn-danger btn-sm\"\n" +
    "                                                            ng-click=\"rmEntry(config.HostConfig.Binds, bind)\">Remove\n" +
    "                                                    </button>\n" +
    "                                                </div>\n" +
    "                                            </div>\n" +
    "                                            <button type=\"button\" class=\"btn btn-success btn-sm\"\n" +
    "                                                    ng-click=\"addEntry(config.HostConfig.Binds, {name: ''})\">Add Bind\n" +
    "                                            </button>\n" +
    "                                        </div>\n" +
    "                                        <div class=\"form-group\">\n" +
    "                                            <label>Links:</label>\n" +
    "\n" +
    "                                            <div ng-repeat=\"link in config.HostConfig.Links\">\n" +
    "                                                <div class=\"form-group form-inline\">\n" +
    "                                                    <input type=\"text\" ng-model=\"link.name\" class=\"form-control\"\n" +
    "                                                           placeholder=\"web:db\">\n" +
    "                                                    <button type=\"button\" class=\"btn btn-danger btn-sm\"\n" +
    "                                                            ng-click=\"rmEntry(config.HostConfig.Links, link)\">Remove\n" +
    "                                                    </button>\n" +
    "                                                </div>\n" +
    "                                            </div>\n" +
    "                                            <button type=\"button\" class=\"btn btn-success btn-sm\"\n" +
    "                                                    ng-click=\"addEntry(config.HostConfig.Links, {name: ''})\">Add Link\n" +
    "                                            </button>\n" +
    "                                        </div>\n" +
    "                                        <div class=\"form-group\">\n" +
    "                                            <label>Dns:</label>\n" +
    "\n" +
    "                                            <div ng-repeat=\"entry in config.HostConfig.Dns\">\n" +
    "                                                <div class=\"form-group form-inline\">\n" +
    "                                                    <input type=\"text\" ng-model=\"entry.name\" class=\"form-control\"\n" +
    "                                                           placeholder=\"8.8.8.8\"/>\n" +
    "                                                    <button type=\"button\" class=\"btn btn-danger btn-sm\"\n" +
    "                                                            ng-click=\"rmEntry(config.HostConfig.Dns, entry)\">Remove\n" +
    "                                                    </button>\n" +
    "                                                </div>\n" +
    "                                            </div>\n" +
    "                                            <button type=\"button\" class=\"btn btn-success btn-sm\"\n" +
    "                                                    ng-click=\"addEntry(config.HostConfig.Dns, {name: ''})\">Add entry\n" +
    "                                            </button>\n" +
    "                                        </div>\n" +
    "                                        <div class=\"form-group\">\n" +
    "                                            <label>DnsSearch:</label>\n" +
    "\n" +
    "                                            <div ng-repeat=\"entry in config.HostConfig.DnsSearch\">\n" +
    "                                                <div class=\"form-group form-inline\">\n" +
    "                                                    <input type=\"text\" ng-model=\"entry.name\" class=\"form-control\"\n" +
    "                                                           placeholder=\"example.com\"/>\n" +
    "                                                    <button type=\"button\" class=\"btn btn-danger btn-sm\"\n" +
    "                                                            ng-click=\"rmEntry(config.HostConfig.DnsSearch, entry)\">\n" +
    "                                                        Remove\n" +
    "                                                    </button>\n" +
    "                                                </div>\n" +
    "                                            </div>\n" +
    "                                            <button type=\"button\" class=\"btn btn-success btn-sm\"\n" +
    "                                                    ng-click=\"addEntry(config.HostConfig.DnsSearch, {name: ''})\">Add\n" +
    "                                                entry\n" +
    "                                            </button>\n" +
    "                                        </div>\n" +
    "                                        <div class=\"form-group\">\n" +
    "                                            <label>CapAdd:</label>\n" +
    "\n" +
    "                                            <div ng-repeat=\"entry in config.HostConfig.CapAdd\">\n" +
    "                                                <div class=\"form-group form-inline\">\n" +
    "                                                    <input type=\"text\" ng-model=\"entry.name\" class=\"form-control\"\n" +
    "                                                           placeholder=\"cap_sys_admin\"/>\n" +
    "                                                    <button type=\"button\" class=\"btn btn-danger btn-sm\"\n" +
    "                                                            ng-click=\"rmEntry(config.HostConfig.CapAdd, entry)\">Remove\n" +
    "                                                    </button>\n" +
    "                                                </div>\n" +
    "                                            </div>\n" +
    "                                            <button type=\"button\" class=\"btn btn-success btn-sm\"\n" +
    "                                                    ng-click=\"addEntry(config.HostConfig.CapAdd, {name: ''})\">Add entry\n" +
    "                                            </button>\n" +
    "                                        </div>\n" +
    "                                        <div class=\"form-group\">\n" +
    "                                            <label>CapDrop:</label>\n" +
    "\n" +
    "                                            <div ng-repeat=\"entry in config.HostConfig.CapDrop\">\n" +
    "                                                <div class=\"form-group form-inline\">\n" +
    "                                                    <input type=\"text\" ng-model=\"entry.name\" class=\"form-control\"\n" +
    "                                                           placeholder=\"cap_sys_admin\"/>\n" +
    "                                                    <button type=\"button\" class=\"btn btn-danger btn-sm\"\n" +
    "                                                            ng-click=\"rmEntry(config.HostConfig.CapDrop, entry)\">Remove\n" +
    "                                                    </button>\n" +
    "                                                </div>\n" +
    "                                            </div>\n" +
    "                                            <button type=\"button\" class=\"btn btn-success btn-sm\"\n" +
    "                                                    ng-click=\"addEntry(config.HostConfig.CapDrop, {name: ''})\">Add entry\n" +
    "                                            </button>\n" +
    "                                        </div>\n" +
    "                                    </div>\n" +
    "                                    <div class=\"col-xs-6\">\n" +
    "                                        <div class=\"form-group\">\n" +
    "                                            <label>NetworkMode:</label>\n" +
    "                                            <input type=\"text\" ng-model=\"config.HostConfig.NetworkMode\"\n" +
    "                                                   class=\"form-control\" placeholder=\"bridge\"/>\n" +
    "                                        </div>\n" +
    "                                        <div class=\"form-group\">\n" +
    "                                            <label for=\"publishAllPorts\">PublishAllPorts:</label>\n" +
    "                                            <input id=\"publishAllPorts\" type=\"checkbox\"\n" +
    "                                                   ng-model=\"config.HostConfig.PublishAllPorts\"/>\n" +
    "                                        </div>\n" +
    "                                        <div class=\"form-group\">\n" +
    "                                            <label for=\"privileged\">Privileged:</label>\n" +
    "                                            <input id=\"privileged\" type=\"checkbox\"\n" +
    "                                                   ng-model=\"config.HostConfig.Privileged\"/>\n" +
    "                                        </div>\n" +
    "                                        <div class=\"form-group\">\n" +
    "                                            <label>VolumesFrom:</label>\n" +
    "\n" +
    "                                            <div ng-repeat=\"volume in config.HostConfig.VolumesFrom\">\n" +
    "                                                <div class=\"form-group form-inline\">\n" +
    "                                                    <select ng-model=\"volume.name\"\n" +
    "                                                            ng-options=\"name for name in containerNames track by name\"\n" +
    "                                                            class=\"form-control\">\n" +
    "                                                    </select>\n" +
    "                                                    <button class=\"btn btn-danger btn-xs form-control\"\n" +
    "                                                            ng-click=\"rmEntry(config.HostConfig.VolumesFrom, volume)\">\n" +
    "                                                        Remove\n" +
    "                                                    </button>\n" +
    "                                                </div>\n" +
    "                                            </div>\n" +
    "                                            <button type=\"button\" class=\"btn btn-success btn-sm\"\n" +
    "                                                    ng-click=\"addEntry(config.HostConfig.VolumesFrom, {name: ''})\">Add\n" +
    "                                                volume\n" +
    "                                            </button>\n" +
    "                                        </div>\n" +
    "\n" +
    "                                        <div class=\"form-group\">\n" +
    "                                            <label>RestartPolicy:</label>\n" +
    "                                            <select ng-model=\"config.HostConfig.RestartPolicy.name\">\n" +
    "                                                <option value=\"\">disabled</option>\n" +
    "                                                <option value=\"always\">always</option>\n" +
    "                                                <option value=\"on-failure\">on-failure</option>\n" +
    "                                            </select>\n" +
    "                                            <label>MaximumRetryCount:</label>\n" +
    "                                            <input type=\"number\"\n" +
    "                                                   ng-model=\"config.HostConfig.RestartPolicy.MaximumRetryCount\"/>\n" +
    "                                        </div>\n" +
    "                                    </div>\n" +
    "                                </div>\n" +
    "                                <hr>\n" +
    "                                <div class=\"form-group\">\n" +
    "                                    <label>ExtraHosts:</label>\n" +
    "\n" +
    "                                    <div ng-repeat=\"entry in config.HostConfig.ExtraHosts\">\n" +
    "                                        <div class=\"form-group form-inline\">\n" +
    "                                            <div class=\"form-group\">\n" +
    "                                                <label class=\"sr-only\">Hostname:</label>\n" +
    "                                                <input type=\"text\" ng-model=\"entry.host\" class=\"form-control\"\n" +
    "                                                       placeholder=\"hostname\"/>\n" +
    "                                            </div>\n" +
    "                                            <div class=\"form-group\">\n" +
    "                                                <label class=\"sr-only\">IP Address:</label>\n" +
    "                                                <input type=\"text\" ng-model=\"entry.ip\" class=\"form-control\"\n" +
    "                                                       placeholder=\"127.0.0.1\"/>\n" +
    "                                            </div>\n" +
    "                                            <div class=\"form-group\">\n" +
    "                                                <button class=\"btn btn-danger btn-xs form-control\"\n" +
    "                                                        ng-click=\"rmEntry(config.HostConfig.ExtraHosts, entry)\">Remove\n" +
    "                                                </button>\n" +
    "                                            </div>\n" +
    "                                        </div>\n" +
    "                                    </div>\n" +
    "                                    <button type=\"button\" class=\"btn btn-success btn-sm\"\n" +
    "                                            ng-click=\"addEntry(config.HostConfig.ExtraHosts, {host: '', ip: ''})\">Add\n" +
    "                                        extra host\n" +
    "                                    </button>\n" +
    "                                </div>\n" +
    "                                <div class=\"form-group\">\n" +
    "                                    <label>LxcConf:</label>\n" +
    "\n" +
    "                                    <div ng-repeat=\"entry in config.HostConfig.LxcConf\">\n" +
    "                                        <div class=\"form-group form-inline\">\n" +
    "                                            <div class=\"form-group\">\n" +
    "                                                <label class=\"sr-only\">Name:</label>\n" +
    "                                                <input type=\"text\" ng-model=\"entry.name\" class=\"form-control\"\n" +
    "                                                       placeholder=\"lxc.utsname\"/>\n" +
    "                                            </div>\n" +
    "                                            <div class=\"form-group\">\n" +
    "                                                <label class=\"sr-only\">Value:</label>\n" +
    "                                                <input type=\"text\" ng-model=\"entry.value\" class=\"form-control\"\n" +
    "                                                       placeholder=\"docker\"/>\n" +
    "                                            </div>\n" +
    "                                            <div class=\"form-group\">\n" +
    "                                                <button class=\"btn btn-danger btn-xs form-control\"\n" +
    "                                                        ng-click=\"rmEntry(config.HostConfig.LxcConf, entry)\">Remove\n" +
    "                                                </button>\n" +
    "                                            </div>\n" +
    "                                        </div>\n" +
    "                                    </div>\n" +
    "                                    <button type=\"button\" class=\"btn btn-success btn-sm\"\n" +
    "                                            ng-click=\"addEntry(config.HostConfig.LxcConf, {name: '', value: ''})\">Add\n" +
    "                                        Entry\n" +
    "                                    </button>\n" +
    "                                </div>\n" +
    "                                <div class=\"form-group\">\n" +
    "                                    <label>Devices:</label>\n" +
    "\n" +
    "                                    <div ng-repeat=\"device in config.HostConfig.Devices\">\n" +
    "                                        <div class=\"form-group form-inline inline-four\">\n" +
    "                                            <label class=\"sr-only\">PathOnHost:</label>\n" +
    "                                            <input type=\"text\" ng-model=\"device.PathOnHost\" class=\"form-control\"\n" +
    "                                                   placeholder=\"PathOnHost\"/>\n" +
    "                                            <label class=\"sr-only\">PathInContainer:</label>\n" +
    "                                            <input type=\"text\" ng-model=\"device.PathInContainer\" class=\"form-control\"\n" +
    "                                                   placeholder=\"PathInContainer\"/>\n" +
    "                                            <label class=\"sr-only\">CgroupPermissions:</label>\n" +
    "                                            <input type=\"text\" ng-model=\"device.CgroupPermissions\" class=\"form-control\"\n" +
    "                                                   placeholder=\"CgroupPermissions\"/>\n" +
    "                                            <button class=\"btn btn-danger btn-xs form-control\"\n" +
    "                                                    ng-click=\"rmEntry(config.HostConfig.Devices, device)\">Remove\n" +
    "                                            </button>\n" +
    "                                        </div>\n" +
    "                                    </div>\n" +
    "                                    <button type=\"button\" class=\"btn btn-success btn-sm\"\n" +
    "                                            ng-click=\"addEntry(config.HostConfig.Devices, { PathOnHost: '', PathInContainer: '', CgroupPermissions: ''})\">\n" +
    "                                        Add Device\n" +
    "                                    </button>\n" +
    "                                </div>\n" +
    "                                <div class=\"form-group\">\n" +
    "                                    <label>PortBindings:</label>\n" +
    "\n" +
    "                                    <div ng-repeat=\"portBinding in config.HostConfig.PortBindings\">\n" +
    "                                        <div class=\"form-group form-inline inline-four\">\n" +
    "                                            <label class=\"sr-only\">Host IP:</label>\n" +
    "                                            <input type=\"text\" ng-model=\"portBinding.ip\" class=\"form-control\"\n" +
    "                                                   placeholder=\"Host IP Address\"/>\n" +
    "                                            <label class=\"sr-only\">Host Port:</label>\n" +
    "                                            <input type=\"text\" ng-model=\"portBinding.extPort\" class=\"form-control\"\n" +
    "                                                   placeholder=\"Host Port\"/>\n" +
    "                                            <label class=\"sr-only\">Container port:</label>\n" +
    "                                            <input type=\"text\" ng-model=\"portBinding.intPort\" class=\"form-control\"\n" +
    "                                                   placeholder=\"Container Port\"/>\n" +
    "                                            <select ng-model=\"portBinding.protocol\">\n" +
    "                                                <option value=\"\">tcp</option>\n" +
    "                                                <option value=\"udp\">udp</option>\n" +
    "                                            </select>\n" +
    "                                            <button class=\"btn btn-danger btn-xs form-control\"\n" +
    "                                                    ng-click=\"rmEntry(config.HostConfig.PortBindings, portBinding)\">\n" +
    "                                                Remove\n" +
    "                                            </button>\n" +
    "                                        </div>\n" +
    "                                    </div>\n" +
    "                                    <button type=\"button\" class=\"btn btn-success btn-sm\"\n" +
    "                                            ng-click=\"addEntry(config.HostConfig.PortBindings, {ip: '', extPort: '', intPort: ''})\">\n" +
    "                                        Add Port Binding\n" +
    "                                    </button>\n" +
    "                                </div>\n" +
    "                            </fieldset>\n" +
    "                        </accordion-group>\n" +
    "                    </accordion>\n" +
    "                </form>\n" +
    "            </div>\n" +
    "            <div class=\"modal-footer\">\n" +
    "                <a href=\"\" class=\"btn btn-primary btn-lg\" ng-click=\"create()\">Create</a>\n" +
    "            </div>\n" +
    "        </div>\n" +
    "    </div>\n" +
    "</div>\n" +
    "");
}]);

angular.module("app/components/stats/stats.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("app/components/stats/stats.html",
    "<div class=\"row\">\n" +
    "    <div class=\"col-xs-12\">\n" +
    "        <h1>Stats for: {{ containerName }}</h1>\n" +
    "\n" +
    "        <h2>CPU</h2>\n" +
    "\n" +
    "        <div class=\"row\">\n" +
    "            <div class=\"col-sm-7\">\n" +
    "                <canvas id=\"cpu-stats-chart\" width=\"650\" height=\"300\"></canvas>\n" +
    "            </div>\n" +
    "        </div>\n" +
    "\n" +
    "        <h2>Memory</h2>\n" +
    "\n" +
    "        <div class=\"row\">\n" +
    "            <div class=\"col-sm-7\">\n" +
    "                <canvas id=\"memory-stats-chart\" width=\"650\" height=\"300\"></canvas>\n" +
    "            </div>\n" +
    "            <div class=\"col-sm-offset-1 col-sm-4\">\n" +
    "                <table class=\"table\">\n" +
    "                    <tr>\n" +
    "                        <td>Max usage</td>\n" +
    "                        <td>{{ data.memory_stats.max_usage | humansize }}</td>\n" +
    "                    </tr>\n" +
    "                    <tr>\n" +
    "                        <td>Limit</td>\n" +
    "                        <td>{{ data.memory_stats.limit | humansize }}</td>\n" +
    "                    </tr>\n" +
    "                    <tr>\n" +
    "                        <td>Fail count</td>\n" +
    "                        <td>{{ data.memory_stats.failcnt }}</td>\n" +
    "                    </tr>\n" +
    "                </table>\n" +
    "                <accordion>\n" +
    "                    <accordion-group heading=\"Other stats\">\n" +
    "                        <table class=\"table\">\n" +
    "                            <tr ng-repeat=\"(key, value) in data.memory_stats.stats\">\n" +
    "                                <td>{{ key }}</td>\n" +
    "                                <td>{{ value }}</td>\n" +
    "                            </tr>\n" +
    "                        </table>\n" +
    "                    </accordion-group>\n" +
    "                </accordion>\n" +
    "            </div>\n" +
    "        </div>\n" +
    "\n" +
    "        <h1>Network {{ networkName}}</h1>\n" +
    "        <div class=\"row\">\n" +
    "            <div class=\"col-sm-7\">\n" +
    "                <canvas id=\"network-stats-chart\" width=\"650\" height=\"300\"></canvas>\n" +
    "            </div>\n" +
    "            <div class=\"col-sm-offset-1 col-sm-4\">\n" +
    "                <div id=\"network-legend\" style=\"margin-bottom: 20px;\"></div>\n" +
    "                <accordion>\n" +
    "                    <accordion-group heading=\"Other stats\">\n" +
    "                        <table class=\"table\">\n" +
    "                            <tr ng-repeat=\"(key, value) in data.network\">\n" +
    "                                <td>{{ key }}</td>\n" +
    "                                <td>{{ value }}</td>\n" +
    "                            </tr>\n" +
    "                        </table>\n" +
    "                    </accordion-group>\n" +
    "                </accordion>\n" +
    "            </div>\n" +
    "        </div>\n" +
    "    </div>\n" +
    "</div>\n" +
    "");
}]);

angular.module("app/components/swarm/swarm.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("app/components/swarm/swarm.html",
    "<div class=\"row\">\n" +
    "  <div class=\"col-lg-3 col-md-6 col-xs-12\">\n" +
    "    <rd-widget>\n" +
    "      <rd-widget-body>\n" +
    "        <div class=\"widget-icon pull-left\">\n" +
    "          <i class=\"fa fa-code\"></i>\n" +
    "        </div>\n" +
    "        <div class=\"title\">{{ docker.Version }}</div>\n" +
    "        <div class=\"comment\">Swarm version</div>\n" +
    "      </rd-widget-body>\n" +
    "    </rd-widget>\n" +
    "  </div>\n" +
    "  <div class=\"col-lg-3 col-md-6 col-xs-12\">\n" +
    "    <rd-widget>\n" +
    "      <rd-widget-body>\n" +
    "        <div class=\"widget-icon pull-left\">\n" +
    "          <i class=\"fa fa-code\"></i>\n" +
    "        </div>\n" +
    "        <div class=\"title\">{{ docker.ApiVersion }}</div>\n" +
    "        <div class=\"comment\">API version</div>\n" +
    "      </rd-widget-body>\n" +
    "    </rd-widget>\n" +
    "  </div>\n" +
    "  <div class=\"col-lg-3 col-md-6 col-xs-12\">\n" +
    "    <rd-widget>\n" +
    "      <rd-widget-body>\n" +
    "        <div class=\"widget-icon pull-left\">\n" +
    "          <i class=\"fa fa-code\"></i>\n" +
    "        </div>\n" +
    "        <div class=\"title\">{{ docker.GoVersion }}</div>\n" +
    "        <div class=\"comment\">Go version</div>\n" +
    "      </rd-widget-body>\n" +
    "    </rd-widget>\n" +
    "  </div>\n" +
    "</div>\n" +
    "\n" +
    "<div class=\"row\">\n" +
    "  <div class=\"col-lg-6\">\n" +
    "    <rd-widget>\n" +
    "      <rd-widget-header icon=\"fa-object-group\" title=\"Cluster status\"></rd-widget-header>\n" +
    "      <rd-widget-body classes=\"no-padding\">\n" +
    "        <table class=\"table\">\n" +
    "          <tbody>\n" +
    "            <tr>\n" +
    "              <td>Nodes</td>\n" +
    "              <td>{{ swarm.Nodes }}</td>\n" +
    "            </tr>\n" +
    "            <tr>\n" +
    "              <td>Containers</td>\n" +
    "              <td>{{ info.Containers }}</td>\n" +
    "            </tr>\n" +
    "            <tr>\n" +
    "              <td>Images</td>\n" +
    "              <td>{{ info.Images }}</td>\n" +
    "            </tr>\n" +
    "            <tr>\n" +
    "              <td>Strategy</td>\n" +
    "              <td>{{ swarm.Strategy }}</td>\n" +
    "            </tr>\n" +
    "            <tr>\n" +
    "              <td>CPUs</td>\n" +
    "              <td>{{ info.NCPU }}</td>\n" +
    "            </tr>\n" +
    "            <tr>\n" +
    "              <td>Total Memory</td>\n" +
    "              <td>{{ info.MemTotal|humansize }}</td>\n" +
    "            </tr>\n" +
    "            <tr>\n" +
    "              <td>Operating System</td>\n" +
    "              <td>{{ info.OperatingSystem }}</td>\n" +
    "            </tr>\n" +
    "            <tr>\n" +
    "              <td>Kernel Version</td>\n" +
    "              <td>{{ info.KernelVersion }}</td>\n" +
    "            </tr>\n" +
    "          </tbody>\n" +
    "        </table>\n" +
    "      </rd-widget-body>\n" +
    "    </rd-widget>\n" +
    "  </div>\n" +
    "  <div class=\"col-lg-6\">\n" +
    "    <rd-widget>\n" +
    "      <rd-widget-header icon=\"fa-hdd-o\" title=\"Nodes status\"></rd-widget-header>\n" +
    "      <rd-widget-body classes=\"no-padding\">\n" +
    "        <table class=\"table table-striped\">\n" +
    "          <thead>\n" +
    "            <tr>\n" +
    "              <th>\n" +
    "                <a href=\"#/swarm/\" ng-click=\"order('Name')\">\n" +
    "                  Name\n" +
    "                  <span ng-show=\"sortType == 'Name' && !sortReverse\" class=\"glyphicon glyphicon-chevron-down\"></span>\n" +
    "                  <span ng-show=\"sortType == 'Name' && sortReverse\" class=\"glyphicon glyphicon-chevron-up\"></span>\n" +
    "                </a>\n" +
    "              </th>\n" +
    "              <th>\n" +
    "                <a href=\"#/swarm/\" ng-click=\"order('IP')\">\n" +
    "                  IP\n" +
    "                  <span ng-show=\"sortType == 'IP' && !sortReverse\" class=\"glyphicon glyphicon-chevron-down\"></span>\n" +
    "                  <span ng-show=\"sortType == 'IP' && sortReverse\" class=\"glyphicon glyphicon-chevron-up\"></span>\n" +
    "                </a>\n" +
    "              </th>\n" +
    "              <th>\n" +
    "                <a href=\"#/swarm/\" ng-click=\"order('Containers')\">\n" +
    "                  Containers\n" +
    "                  <span ng-show=\"sortType == 'Containers' && !sortReverse\" class=\"glyphicon glyphicon-chevron-down\"></span>\n" +
    "                  <span ng-show=\"sortType == 'Containers' && sortReverse\" class=\"glyphicon glyphicon-chevron-up\"></span>\n" +
    "                </a>\n" +
    "              </th>\n" +
    "              <th>\n" +
    "                <a href=\"#/swarm/\" ng-click=\"order('Status')\">\n" +
    "                  Status\n" +
    "                  <span ng-show=\"sortType == 'Status' && !sortReverse\" class=\"glyphicon glyphicon-chevron-down\"></span>\n" +
    "                  <span ng-show=\"sortType == 'Status' && sortReverse\" class=\"glyphicon glyphicon-chevron-up\"></span>\n" +
    "                </a>\n" +
    "              </th>\n" +
    "            </tr>\n" +
    "          </thead>\n" +
    "          <tbody>\n" +
    "            <tr ng-repeat=\"node in (state.filteredNodes = (swarm.Status | filter:state.filter | orderBy:sortType:sortReverse))\">\n" +
    "              <td>{{ node.name }}</td>\n" +
    "              <td>{{ node.ip }}</td>\n" +
    "              <td>{{ node.containers }}</td>\n" +
    "              <td><span class=\"label label-{{ node.status|statusbadge }}\">{{ node.status }}</span></td>\n" +
    "            </tr>\n" +
    "          </tbody>\n" +
    "        </table>\n" +
    "      </rd-widget-body>\n" +
    "    </rd-widget>\n" +
    "  </div>\n" +
    "</div>\n" +
    "");
}]);

angular.module("app/components/volumes/volumes.dup.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("app/components/volumes/volumes.dup.html",
    "<h2>Volumes:</h2>\n" +
    "\n" +
    "<div>\n" +
    "    <ul class=\"nav nav-pills pull-left\">\n" +
    "        <li class=\"dropdown\">\n" +
    "            <a class=\"dropdown-toggle\" id=\"drop4\" role=\"button\" data-toggle=\"dropdown\" data-target=\"#\">Actions <b\n" +
    "                    class=\"caret\"></b></a>\n" +
    "            <ul id=\"menu1\" class=\"dropdown-menu\" role=\"menu\" aria-labelledby=\"drop4\">\n" +
    "                <li><a tabindex=\"-1\" href=\"\" ng-click=\"removeAction()\">Remove</a></li>\n" +
    "            </ul>\n" +
    "        </li>\n" +
    "    </ul>\n" +
    "\n" +
    "    <div class=\"pull-right form-inline\">\n" +
    "        <input type=\"text\" class=\"form-control\" id=\"filter\" placeholder=\"Filter\" ng-model=\"filter\"/> <label\n" +
    "            class=\"sr-only\" for=\"filter\">Filter</label>\n" +
    "    </div>\n" +
    "</div>\n" +
    "<table class=\"table table-striped\">\n" +
    "    <thead>\n" +
    "    <tr>\n" +
    "        <th><label><input type=\"checkbox\" ng-model=\"toggle\" ng-change=\"toggleSelectAll()\"/> Select</label></th>\n" +
    "        <th>\n" +
    "            <a href=\"#/volumes/\" ng-click=\"order('Name')\">\n" +
    "                Name\n" +
    "                <span ng-show=\"sortType == 'Name' && !sortReverse\" class=\"glyphicon glyphicon-chevron-down\"></span>\n" +
    "                <span ng-show=\"sortType == 'Name' && sortReverse\" class=\"glyphicon glyphicon-chevron-up\"></span>\n" +
    "            </a>\n" +
    "        </th>\n" +
    "        <th>\n" +
    "            <a href=\"#/volumes/\" ng-click=\"order('Driver')\">\n" +
    "                Driver\n" +
    "                <span ng-show=\"sortType == 'Driver' && !sortReverse\" class=\"glyphicon glyphicon-chevron-down\"></span>\n" +
    "                <span ng-show=\"sortType == 'Driver' && sortReverse\" class=\"glyphicon glyphicon-chevron-up\"></span>\n" +
    "            </a>\n" +
    "        </th>\n" +
    "        <th>\n" +
    "            <a href=\"#/volumes/\" ng-click=\"order('Mountpoint')\">\n" +
    "                Mountpoint\n" +
    "                <span ng-show=\"sortType == 'Mountpoint' && !sortReverse\" class=\"glyphicon glyphicon-chevron-down\"></span>\n" +
    "                <span ng-show=\"sortType == 'Mountpoint' && sortReverse\" class=\"glyphicon glyphicon-chevron-up\"></span>\n" +
    "            </a>\n" +
    "        </th>\n" +
    "    </tr>\n" +
    "    </thead>\n" +
    "    <tbody>\n" +
    "    <tr ng-repeat=\"volume in (filteredVolumes = (volumes | filter:filter | orderBy:sortType:sortReverse))\">\n" +
    "        <td><input type=\"checkbox\" ng-model=\"volume.Checked\"/></td>\n" +
    "        <td>{{ volume.Name|truncate:20 }}</td>\n" +
    "        <td>{{ volume.Driver }}</td>\n" +
    "        <td>{{ volume.Mountpoint }}</td>\n" +
    "    </tr>\n" +
    "    </tbody>\n" +
    "</table>\n" +
    "<div class=\"row\">\n" +
    "    <div class=\"col-xs-offset-3 col-xs-6\">\n" +
    "        <form role=\"form\" class=\"\">\n" +
    "            <div class=\"form-group\">\n" +
    "                <label>Name:</label>\n" +
    "                <input type=\"text\" placeholder='tardis'\n" +
    "                       ng-model=\"createVolumeConfig.Name\" class=\"form-control\"/>\n" +
    "            </div>\n" +
    "            <div class=\"form-group\">\n" +
    "                <label>Driver:</label>\n" +
    "                <input type=\"text\" placeholder='local'\n" +
    "                       ng-model=\"createVolumeConfig.Driver\" class=\"form-control\"/>\n" +
    "            </div>\n" +
    "            <div class=\"form-group\">\n" +
    "                <label>Options:</label>\n" +
    "                <button class=\"addOpts\" ng-click=\"addNewOption()\">Add option</button>\n" +
    "                <button class=\"remove\" ng-click=\"removeOption()\">Remove option</button>\n" +
    "                <fieldset  data-ng-repeat=\"option in driverOptions\">\n" +
    "    				      Name: <input type=\"text\" ng-model=\"option.name\" name=\"\" placeholder=\"Option name\" class=\"form-control\">\n" +
    "                  Value: <input type=\"text\" ng-model=\"option.value\" name=\"\" placeholder=\"Option value\" class=\"form-control\">\n" +
    "				        </fieldset>\n" +
    "            </div>\n" +
    "            <button type=\"button\" class=\"btn btn-success btn-sm\"\n" +
    "                    ng-click=\"addVolume(createVolumeConfig)\">\n" +
    "                Create Volume\n" +
    "            </button>\n" +
    "        </form>\n" +
    "    </div>\n" +
    "</div>\n" +
    "");
}]);

angular.module("app/components/volumes/volumes.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("app/components/volumes/volumes.html",
    "<div class=\"col-lg-12\">\n" +
    "  <rd-widget>\n" +
    "    <rd-widget-header icon=\"fa-cubes\" title=\"Volumes\">\n" +
    "    </rd-widget-header>\n" +
    "    <rd-widget-taskbar classes=\"col-lg-12\">\n" +
    "      <div class=\"pull-left\">\n" +
    "        <div class=\"btn-group\" role=\"group\" aria-label=\"...\">\n" +
    "          <button type=\"button\" class=\"btn btn-default\">Remove</button>\n" +
    "          <button type=\"button\" class=\"btn btn-default\">Create new volume...</button>\n" +
    "        </div>\n" +
    "      </div>\n" +
    "      <div class=\"pull-right\">\n" +
    "        <input type=\"text\" id=\"filter\" ng-model=\"state.filter\" placeholder=\"Filter...\" class=\"form-control input-sm\" />\n" +
    "      </div>\n" +
    "    </rd-widget-taskbar>\n" +
    "    <rd-widget-body classes=\"no-padding\">\n" +
    "      <div class=\"table-responsive\">\n" +
    "        <table class=\"table\">\n" +
    "          <thead>\n" +
    "            <tr>\n" +
    "              <th><label><input type=\"checkbox\" ng-model=\"state.toggle\" ng-change=\"toggleSelectAll()\"/> Select</label></th>\n" +
    "              <th>\n" +
    "                <a href=\"#/volumes/\" ng-click=\"order('Name')\">\n" +
    "                  Name\n" +
    "                  <span ng-show=\"sortType == 'Name' && !sortReverse\" class=\"glyphicon glyphicon-chevron-down\"></span>\n" +
    "                  <span ng-show=\"sortType == 'Name' && sortReverse\" class=\"glyphicon glyphicon-chevron-up\"></span>\n" +
    "                </a>\n" +
    "              </th>\n" +
    "              <th>\n" +
    "                <a href=\"#/volumes/\" ng-click=\"order('Driver')\">\n" +
    "                  Driver\n" +
    "                  <span ng-show=\"sortType == 'Driver' && !sortReverse\" class=\"glyphicon glyphicon-chevron-down\"></span>\n" +
    "                  <span ng-show=\"sortType == 'Driver' && sortReverse\" class=\"glyphicon glyphicon-chevron-up\"></span>\n" +
    "                </a>\n" +
    "              </th>\n" +
    "              <th>\n" +
    "                <a href=\"#/volumes/\" ng-click=\"order('Mountpoint')\">\n" +
    "                  Mountpoint\n" +
    "                  <span ng-show=\"sortType == 'Mountpoint' && !sortReverse\" class=\"glyphicon glyphicon-chevron-down\"></span>\n" +
    "                  <span ng-show=\"sortType == 'Mountpoint' && sortReverse\" class=\"glyphicon glyphicon-chevron-up\"></span>\n" +
    "                </a>\n" +
    "              </th>\n" +
    "            </tr>\n" +
    "          </thead>\n" +
    "          <tbody>\n" +
    "            <tr ng-repeat=\"volume in (state.filteredVolumes = (volumes | filter:state.filter | orderBy:sortType:sortReverse))\">\n" +
    "              <td><input type=\"checkbox\" ng-model=\"volume.Checked\"/></td>\n" +
    "              <td>{{ volume.Name|truncate:20 }}</td>\n" +
    "              <td>{{ volume.Driver }}</td>\n" +
    "              <td>{{ volume.Mountpoint }}</td>\n" +
    "            </tr>\n" +
    "          </tbody>\n" +
    "        </table>\n" +
    "      </div>\n" +
    "    </rd-widget-body>\n" +
    "  <rd-widget>\n" +
    "</div>\n" +
    "");
}]);

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
                        if (d.HostConfig.PortBindings && port in d.HostConfig.PortBindings)
                            $scope.newCfg.Ports[port] = d.HostConfig.PortBindings[port];
                        else
                            $scope.newCfg.Ports[port] = [];
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
                        var ro = binding.split(':').length > 2 && binding.split(':')[2] == 'ro';
                        var defaultBind = false;
                        if (vol == '') {
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

                var binds = [];
                angular.forEach($scope.newCfg.Binds, function(b) {
                    if (b.ContPath != '') {
                        var bindLine = '';
                        if (b.HostPath != '') {
                            bindLine = b.HostPath + ':';
                        }
                        bindLine += b.ContPath;
                        if (b.ReadOnly) {
                            bindLine += ':ro';
                        }
                        if (b.HostPath != '' || !b.DefaultBind) {
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

                            Container.create(imageData.Config, function(containerData) {
                                // Stop current if running
                                if ($scope.container.State.Running) {
                                    Container.stop({id: $routeParams.id}, function (d) {
                                        Messages.send("Container stopped", $routeParams.id);
                                        // start new
                                        Container.start({
                                            id: containerData.Id
                                            // HostConfig: $scope.container.HostConfig we really need this?
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
                                        // HostConfig: $scope.container.HostConfig we really need this?
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
                        })

                    } else {
                        update();
                        Messages.send("Container commit failed", $routeParams.id);
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


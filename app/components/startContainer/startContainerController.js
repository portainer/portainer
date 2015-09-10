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
                    if (col[key] === null || col[key] === undefined || col[key] === '' || $.isEmptyObject(col[key]) || col[key].length === 0) {
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

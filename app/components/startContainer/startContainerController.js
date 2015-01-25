angular.module('startContainer', ['ui.bootstrap'])
.controller('StartContainerController', ['$scope', '$routeParams', '$location', 'Container', 'Messages', 'containernameFilter',
function($scope, $routeParams, $location, Container, Messages, containernameFilter) {
    $scope.template = 'app/components/startContainer/startcontainer.html';

    Container.query({all: 1}, function(d) {
        $scope.containerNames = d.map(function(container){
            return containernameFilter(container);
        });
    });

    $scope.config = {
        Env: [],
        Volumes: [],
        SecurityOpts: [],
        PortBindings: [],
        HostConfig: {
            Binds: [],
            Links: [],
            Dns: [],
            DnsSearch: [],
            VolumesFrom: [],
            CapAdd: [],
            CapDrop: []
        }
    };

    function failedRequestHandler(e, Messages) {
        Messages.send({class: 'text-error', data: e.data});
    }

    function rmEmptyKeys(col) {
        for (var key in col) {
            if (col[key] === null || col[key] === undefined || col[key] === '' || $.isEmptyObject(col[key]) || col[key].length === 0) {
                delete col[key];
            }
        }
    }

    function getNames(arr) {
        return arr.map(function(item) {return item.name;});
    }

    $scope.create = function() {
        // Copy the config before transforming fields to the remote API format
        var config = angular.copy($scope.config);

        config.Image = $routeParams.id;

        if (config.Cmd && config.Cmd[0] === "[") {
            config.Cmd = angular.fromJson(config.Cmd);
        }

        config.Env = config.Env.map(function(envar) {return envar.name + '=' + envar.value;});

        config.Volumes = getNames(config.Volumes);
        config.SecurityOpts = getNames(config.SecurityOpts);

        config.HostConfig.VolumesFrom = getNames(config.HostConfig.VolumesFrom);
        config.HostConfig.Binds = getNames(config.HostConfig.Binds);
        config.HostConfig.Links = getNames(config.HostConfig.Links);
        config.HostConfig.Dns = getNames(config.HostConfig.Dns);
        config.HostConfig.DnsSearch = getNames(config.HostConfig.DnsSearch);
        config.HostConfig.CapAdd = getNames(config.HostConfig.CapAdd);
        config.HostConfig.CapDrop = getNames(config.HostConfig.CapDrop);

        var ExposedPorts = {};
        var PortBindings = {};
        // TODO: consider using compatibility library 
        config.PortBindings.forEach(function(portBinding) {
            var intPort = portBinding.intPort + "/tcp";
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
                // TODO: Send warning message? Internal port need to be specified.
            }
        });
        config.ExposedPorts = ExposedPorts;
        delete config.PortBindings;
        config.HostConfig.PortBindings = PortBindings;

        // Remove empty fields from the request to avoid overriding defaults
        rmEmptyKeys(config.HostConfig);
        rmEmptyKeys(config);

        var ctor = Container;
        var loc = $location;
        var s = $scope;
        Container.create(config, function(d) {
                if (d.Id) {
                    ctor.start({id: d.Id}, function(cd) {
                        $('#create-modal').modal('hide');
                        loc.path('/containers/' + d.Id + '/');
                    }, function(e) {
                        failedRequestHandler(e, Messages);
                    });
                } else {
                    failedRequestHandler(d, Messages);
                }
            }, function(e) {
                failedRequestHandler(e, Messages);
        });
    };

    $scope.addPortBinding = function() {
        $scope.config.PortBindings.push({ip: '', extPort: '', intPort: ''});
    };

    $scope.removePortBinding = function(portBinding) {
        var idx = $scope.config.PortBindings.indexOf(portBinding);
        $scope.config.PortBindings.splice(idx, 1);
    };

    // TODO: refactor out
    $scope.addEnv = function() {
        $scope.config.Env.push({name: '', value: ''});
    };

    $scope.removeEnv = function(envar) {
        var idx = $scope.config.env.indexOf(envar);
        $scope.config.Env.splice(idx, 1);
    };

    // Todo: refactor out
    $scope.addVolumeFrom = function() {
        $scope.config.HostConfig.volumesFrom.push({name: ''});
    };

    $scope.removeVolumeFrom = function(volume) {
        var idx = $scope.config.HostConfig.volumesFrom.indexOf(volume);
        $scope.config.HostConfig.volumesFrom.splice(idx, 1);
    };

    $scope.addEntry = function(array, entry) {
        array.push(entry);
    };
    $scope.rmEntry = function(array, entry) {
        var idx = array.indexOf(entry);
        array.splice(idx, 1);
    };
}]);

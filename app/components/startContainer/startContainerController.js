angular.module('startContainer', [])
.controller('StartContainerController', ['$scope', '$routeParams', '$location', 'Container', 'Messages', 'containernameFilter',
function($scope, $routeParams, $location, Container, Messages, containernameFilter) {
    $scope.template = 'app/components/startContainer/startcontainer.html';

    Container.query({all: 1}, function(d) {
        $scope.containerNames = d.map(function(container){
            return containernameFilter(container);
        });
    });

    $scope.config = {
        name: '',
        memory: 0,
        memorySwap: 0,
        cpuShares: 1024,
        env: [],
        commands: '',
        volumesFrom: [],
        portBindings: []
    };
    $scope.commandPlaceholder = '["/bin/echo", "Hello world"]';

    function failedRequestHandler(e, Messages) {
        Messages.send({class: 'text-error', data: e.data});
    }

    $scope.create = function() {
        var cmds = null;
        if ($scope.config.commands !== '') {
            cmds = angular.fromJson($scope.config.commands);
        }
        var id = $routeParams.id;
        var ctor = Container;
        var loc = $location;
        var s = $scope;

        var volumesFrom = $scope.config.volumesFrom.map(function(volume) {
            return volume.name;
        });

        var env = $scope.config.env.map(function(envar) {
            return envar.name + '=' + envar.value;
        });

        var exposedPorts = {};
        var portBindings = {};
        // TODO: consider using compatibility library 
        $scope.config.portBindings.forEach(function(portBinding) {
            var intPort = portBinding.intPort + "/tcp";
            var binding = {
                HostIp: portBinding.ip,
                HostPort: portBinding.extPort
            };
            if (portBinding.intPort) {
                exposedPorts[intPort] = {};
                if (intPort in portBindings) {
                    portBindings[intPort].push(binding);
                } else {
                    portBindings[intPort] = [binding];
                }
            } else {
                // TODO: Send warning message? Internal port need to be specified.
            }
        });

        Container.create({
                Image: id,
                name: $scope.config.name,
                Memory: $scope.config.memory,
                MemorySwap: $scope.config.memorySwap,
                CpuShares: $scope.config.cpuShares,
                Cmd: cmds,
                VolumesFrom: volumesFrom,
                Env: env,
                ExposedPorts: exposedPorts,
                HostConfig: {
                    PortBindings: portBindings
                }
            }, function(d) {
                if (d.Id) {
                    ctor.start({
                        id: d.Id,
                        HostConfig: {
                            PortBindings: portBindings
                        }
                    }, function(cd) {
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
        $scope.config.portBindings.push({ip: '', extPort: '', intPort: ''});
    };

    $scope.removePortBinding = function(portBinding) {
        var idx = $scope.config.portBindings.indexOf(portBinding);
        $scope.config.portBindings.splice(idx, 1);
    };

    $scope.addEnv = function() {
        $scope.config.env.push({name: '', value: ''});
    };

    $scope.removeEnv = function(envar) {
        var idx = $scope.config.env.indexOf(envar);
        $scope.config.env.splice(idx, 1);
    };

    $scope.addVolume = function() {
        $scope.config.volumesFrom.push({name: ''});
    };

    $scope.removeVolume = function(volume) {
        var idx = $scope.config.volumesFrom.indexOf(volume);
        $scope.config.volumesFrom.splice(idx, 1);
    };
}]);

angular.module('startContainer', [])
.controller('StartContainerController', ['$scope', '$routeParams', '$location', 'Container', 'Messages',
function($scope, $routeParams, $location, Container, Messages) {
    $scope.template = 'app/components/startContainer/startcontainer.html';
    $scope.config = {
        name: '',
        memory: 0,
        memorySwap: 0,
        cpuShares: 1024,
        env: '',
        commands: '',
        volumesFrom: ''
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

        Container.create({
                Image: id,
                name: $scope.config.name,
                Memory: $scope.config.memory,
                MemorySwap: $scope.config.memorySwap,
                CpuShares: $scope.config.cpuShares,
                Cmd: cmds,
                VolumesFrom: $scope.config.volumesFrom
            }, function(d) {
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
}]);

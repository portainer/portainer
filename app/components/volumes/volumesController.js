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
            "Driver": ""
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

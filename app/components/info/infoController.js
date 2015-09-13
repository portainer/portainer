angular.module('info', [])
    .controller('InfoController', ['$scope', 'System', 'Docker', 'Settings', 'Messages',
        function ($scope, System, Docker, Settings, Messages) {
            $scope.info = {};
            $scope.docker = {};
            $scope.endpoint = Settings.endpoint;
            $scope.apiVersion = Settings.version;

            Docker.get({}, function (d) {
                $scope.docker = d;
            });
            System.get({}, function (d) {
                $scope.info = d;
            });
        }]);

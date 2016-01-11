angular.module('info', [])
    .controller('InfoController', ['$scope', 'Info', 'Version', 'Settings',
        function ($scope, Info, Version, Settings) {
            $scope.info = {};
            $scope.docker = {};
            $scope.endpoint = Settings.endpoint;

            Version.get({}, function (d) {
                $scope.docker = d;
            });
            Info.get({}, function (d) {
                $scope.info = d;
            });
        }]);

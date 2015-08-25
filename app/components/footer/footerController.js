angular.module('footer', [])
    .controller('FooterController', ['$scope', 'Settings', 'Docker', function ($scope, Settings, Docker) {
        $scope.template = 'app/components/footer/statusbar.html';

        $scope.uiVersion = Settings.uiVersion;
        Docker.get({}, function (d) {
            $scope.apiVersion = d.ApiVersion;
        });
    }]);

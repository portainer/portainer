angular.module('footer', [])
    .controller('FooterController', ['$scope', 'Settings', 'Version', function ($scope, Settings, Version) {
        $scope.template = 'app/components/footer/statusbar.html';

        $scope.uiVersion = Settings.uiVersion;
        Version.get({}, function (d) {
            $scope.apiVersion = d.ApiVersion;
        });
    }]);

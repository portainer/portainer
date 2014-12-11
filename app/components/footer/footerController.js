angular.module('footer', [])
.controller('FooterController', ['$scope', 'Settings', function($scope, Settings) {
    $scope.template = 'app/components/footer/statusbar.html';

    $scope.uiVersion = Settings.uiVersion;
    $scope.apiVersion = Settings.version;
}]);

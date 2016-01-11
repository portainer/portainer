angular.module('masthead', [])
    .controller('MastheadController', ['$scope', 'Version', function ($scope, Version) {
        $scope.template = 'app/components/masthead/masthead.html';
        $scope.showNetworksVolumes = false;

        Version.get(function(d) {
            if (d.ApiVersion >= 1.21) {
                $scope.showNetworksVolumes = true;
            }
        });

        $scope.refresh = function() {
            location.reload();
        };
    }]);

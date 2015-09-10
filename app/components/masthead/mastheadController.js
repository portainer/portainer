angular.module('masthead', [])
    .controller('MastheadController', ['$scope', function ($scope) {
        $scope.template = 'app/components/masthead/masthead.html';
    }]);

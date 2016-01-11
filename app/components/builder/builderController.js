angular.module('builder', [])
    .controller('BuilderController', ['$scope',
        function ($scope) {
            $scope.template = 'app/components/builder/builder.html';
        }]);

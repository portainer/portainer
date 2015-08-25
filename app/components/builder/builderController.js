angular.module('builder', [])
    .controller('BuilderController', ['$scope', 'Dockerfile', 'Messages',
        function ($scope, Dockerfile, Messages) {
            $scope.template = 'app/components/builder/builder.html';
        }]);

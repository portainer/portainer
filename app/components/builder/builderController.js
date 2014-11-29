angular.module('builder', [])
.controller('BuilderController', ['$scope', 'Dockerfile', 'Messages',
function($scope, Dockerfile, Messages) {
    $scope.template = 'partials/builder.html';
}]);

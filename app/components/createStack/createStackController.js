angular.module('createStack', [])
.controller('CreateStackController', ['$scope', '$state',
function ($scope, $state) {

  $scope.formValues = {
    Name: '',
    ComposeFile: 'version: "3"\nservices:\n\tmyservice:\n\t\timage: my-image'
  };

  $scope.create = function () {
    $('#createStackSpinner').show();

    var name = $scope.formValues.Name;
    var composeFile = $scope.formValues.ComposeFile;
  };
}]);

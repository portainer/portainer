angular.module('createStack', [])
.controller('CreateStackController', ['$scope', '$state', 'StackService', 'Notifications',
function ($scope, $state, StackService, Notifications) {

  $scope.state = {
    Method: 'editor',
    UploadInProgress: false
  };

  $scope.formValues = {
    Name: '',
    ComposeFile: 'version: "3"\nservices:\n\tmyservice:\n\t\timage: my-image',
    ComposeFileUpload: null,
    EnvFileUpload: null,
    RepositoryURL: ''
  };

  $scope.create = function () {
    $('#createStackSpinner').show();

    var name = $scope.formValues.Name;
    var composeFile = $scope.formValues.ComposeFile;

    StackService.createStack(name, composeFile)
    .then(function success(data) {
      Notifications.success('Stack successfully created');
      $state.go('stacks');
    })
    .catch(function error(err) {
      Notifications.error('Failure', err, 'Unable to create stack');
    })
    .finally(function final() {
      $('#createStackSpinner').hide();
    });
  };
}]);

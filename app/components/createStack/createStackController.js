angular.module('createStack', [])
.controller('CreateStackController', ['$scope', '$state', 'StackService', 'Notifications',
function ($scope, $state, StackService, Notifications) {

  $scope.state = {
    Method: 'editor',
    UploadInProgress: false
  };

  $scope.formValues = {
    Name: '',
    ComposeFile: 'version: "2"\nservices:\n  myservice:\n    image: nginx',
    ClusterDeployment: false,
    EnvFile: '',
    ComposeFileUpload: null,
    EnvFileUpload: null,
    RepositoryURL: ''
  };

  $scope.create = function () {
    $('#createStackSpinner').show();

    var name = $scope.formValues.Name;
    var composeFile = $scope.formValues.ComposeFile;
    var envFile = $scope.formValues.EnvFile;

    StackService.createStack(name, composeFile, envFile)
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

  $scope.createAndStart = function () {
    $('#createStackSpinner').show();

    var name = $scope.formValues.Name;
    var composeFile = $scope.formValues.ComposeFile;
    var envFile = $scope.formValues.EnvFile;

    StackService.createStack(name, composeFile, envFile)
    .then(function success(data) {
      var stackId = data.Id;
      return StackService.stackOperationUp(stackId);
    })
    .then(function success() {
      Notifications.success('Stack successfully started');
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

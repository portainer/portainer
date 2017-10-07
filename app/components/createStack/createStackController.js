angular.module('createStack', [])
.controller('CreateStackController', ['$scope', '$state', 'StackService', 'Notifications',
function ($scope, $state, StackService, Notifications) {

  $scope.state = {
    Method: 'editor',
    UploadInProgress: false
  };

  $scope.formValues = {
    Name: '',
    StackFile: 'version: "3"\nservices:\n  myservice:\n    image: nginx\n    deploy:\n      mode: global',
    StackFileUpload: null,
    RepositoryURL: ''
  };

  $scope.deployStack = function () {
    $('#createStackSpinner').show();

    var name = $scope.formValues.Name;
    var stackFile = $scope.formValues.StackFile;

    StackService.createStack(name, stackFile)
    .then(function success(data) {
      Notifications.success('Stack successfully deployed');
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

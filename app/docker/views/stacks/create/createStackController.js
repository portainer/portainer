angular.module('portainer.docker')
.controller('CreateStackController', ['$scope', '$state', 'StackService', 'Authentication', 'Notifications', 'FormValidator', 'ResourceControlService', 'FormHelper',
function ($scope, $state, StackService, Authentication, Notifications, FormValidator, ResourceControlService, FormHelper) {

  $scope.formValues = {
    Name: '',
    StackFileContent: '',
    StackFile: null,
    RepositoryURL: '',
    RepositoryAuthentication: false,
    RepositoryUsername: '',
    RepositoryPassword: '',
    Env: [],
    ComposeFilePathInRepository: 'docker-compose.yml',
    AccessControlData: new AccessControlFormData()
  };

  $scope.state = {
    Method: 'editor',
    formValidationError: '',
    actionInProgress: false
  };

  $scope.addEnvironmentVariable = function() {
    $scope.formValues.Env.push({ name: '', value: ''});
  };

  $scope.removeEnvironmentVariable = function(index) {
    $scope.formValues.Env.splice(index, 1);
  };

  function validateForm(accessControlData, isAdmin) {
    $scope.state.formValidationError = '';
    var error = '';
    error = FormValidator.validateAccessControl(accessControlData, isAdmin);

    if (error) {
      $scope.state.formValidationError = error;
      return false;
    }
    return true;
  }

  function createStack(name, method) {
    var env = FormHelper.removeInvalidEnvVars($scope.formValues.Env);

    if (method === 'editor') {
      var stackFileContent = $scope.formValues.StackFileContent;
      return StackService.createStackFromFileContent(name, stackFileContent, env);
    } else if (method === 'upload') {
      var stackFile = $scope.formValues.StackFile;
      return StackService.createStackFromFileUpload(name, stackFile, env);
    } else if (method === 'repository') {
      var repositoryOptions = {
        RepositoryURL: $scope.formValues.RepositoryURL,
        ComposeFilePathInRepository: $scope.formValues.ComposeFilePathInRepository,
        RepositoryAuthentication: $scope.formValues.RepositoryAuthentication,
        RepositoryUsername: $scope.formValues.RepositoryUsername,
        RepositoryPassword: $scope.formValues.RepositoryPassword
      };
      return StackService.createStackFromGitRepository(name, repositoryOptions, env);
    }
  }

  $scope.deployStack = function () {
    var name = $scope.formValues.Name;
    var method = $scope.state.Method;

    var accessControlData = $scope.formValues.AccessControlData;
    var userDetails = Authentication.getUserDetails();
    var isAdmin = userDetails.role === 1;
    var userId = userDetails.ID;

    if (method === 'editor' && $scope.formValues.StackFileContent === '') {
      $scope.state.formValidationError = 'Stack file content must not be empty';
      return;
    }

    if (!validateForm(accessControlData, isAdmin)) {
      return;
    }

    $scope.state.actionInProgress = true;
    createStack(name, method)
    .then(function success(data) {
      Notifications.success('Stack successfully deployed');
      return ResourceControlService.applyResourceControl('stack', name, userId, accessControlData, [])
      .then(function success() {
        $state.go('docker.stacks');
      })
      .catch(function error(err) {
        Notifications.error('Failure', err, 'Unable to apply resource control on the stack');
      });
    })
    .catch(function error(err) {
      Notifications.warning('Deployment error', err.err.data.err);
    })
    .finally(function final() {
      $scope.state.actionInProgress = false;
    });
  };

  $scope.editorUpdate = function(cm) {
    $scope.formValues.StackFileContent = cm.getValue();
  };
}]);

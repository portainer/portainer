angular.module('createProject', [])
.controller('CreateProjectController', ['$scope', '$state', '$document', 'ProjectService', 'CodeMirrorService', 'Authentication', 'Notifications', 'FormValidator', 'ResourceControlService',
function ($scope, $state, $document, ProjectService, CodeMirrorService, Authentication, Notifications, FormValidator, ResourceControlService) {

  // TODO: Use Orca API call for project drivers...
  $scope.availableProjectDrivers = ['Demo Voting App', 'Demo Security App', 'CENX 7.1.1', 'CENX 7.2'];

  $scope.state = {
    formValidationError: ''
  };

  $scope.addDriverOption = function() {
    $scope.formValues.DriverOptions.push({ name: '', value: '' });
  };

  $scope.removeDriverOption = function(index) {
    $scope.formValues.DriverOptions.splice(index, 1);
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

  $scope.saveProject = function () {
    $('#createResourceSpinner').show();

    /*
    var name = $scope.formValues.Name;

    var accessControlData = $scope.formValues.AccessControlData;
    var userDetails = Authentication.getUserDetails();
    var isAdmin = userDetails.role === 1 ? true : false;
    var userId = userDetails.ID;

    if (!validateForm(accessControlData, isAdmin)) {
      $('#createResourceSpinner').hide();
      return;
    }

    createStack(name)
    .then(function success(data) {
      Notifications.success('Stack successfully deployed');
    })
    .catch(function error(err) {
      Notifications.warning('Deployment error', err.err.data.err);
    })
    .then(function success(data) {
      return ResourceControlService.applyResourceControl('stack', name, userId, accessControlData, []);
    })
    .then(function success() {
      $state.go('stacks');
    })
    .catch(function error(err) {
      Notifications.error('Failure', err, 'Unable to apply resource control on the stack');
    })
    .finally(function final() {
      $('#createResourceSpinner').hide();
    });
    */

    $('#createResourceSpinner').hide();
  };

  function initView() {
  }

  initView();
}]);

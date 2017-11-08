angular.module('createProject', [])
.controller('CreateProjectController', ['$scope', '$state', '$document', 'OrcaProjectService', 'ProjectService', 'CodeMirrorService', 'Authentication', 'Notifications', 'FormValidator', 'ResourceControlService',
function ($scope, $state, $document, OrcaProjectService, ProjectService, CodeMirrorService, Authentication, Notifications, FormValidator, ResourceControlService) {

  $scope.formValues = {
    Name: ''
  };

  $scope.config = {
    Driver: ''
  };

  // TODO: Use Orca API call for project drivers...
  $scope.availableProjectDrivers = ['Swarm Visualizer', 'Demo Voting App', 'Demo Security App', 'CENX 8.0'];

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

    var name = $scope.formValues.Name;
    var driver = $scope.config.Driver;

    OrcaProjectService.create(name, driver)
    .then(function success(data) {
      // console.log("Running task to create new project...")
    })
    .then(function success() {
      Notifications.success('Project creation successfully launched...');
      $state.go('project', {id: name, version: driver, content: 'undefined'}, {reload: true});
    })
    .catch(function error(err) {
      Notifications.error('Failure', err, 'An error occured during project creation');
    })
    .finally(function final() {
      $('#createResourceSpinner').hide();
    });

    $('#createResourceSpinner').hide();
  };

  function initView() {
  }

  initView();
}]);

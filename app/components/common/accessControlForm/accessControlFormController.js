angular.module('common.accesscontrol.form', [])
.controller('AccessControlFormController', ['$q', '$scope', '$state', 'UserService', 'ResourceControlService', 'Notifications', 'Authentication', 'ModalService', 'ControllerDataPipeline',
function ($q, $scope, $state, UserService, ResourceControlService, Notifications, Authentication, ModalService, ControllerDataPipeline) {

  $scope.availableTeams = [];
  $scope.availableUsers = [];

  $scope.formValues = {
    enableAccessControl: true,
    Ownership_Teams: [],
    Ownership_Users: [],
    Ownership: 'private'
  };

  $scope.synchronizeFormData = function() {
    ControllerDataPipeline.setAccessControlFormData($scope.formValues.enableAccessControl,
      $scope.formValues.Ownership, $scope.formValues.Ownership_Users, $scope.formValues.Ownership_Teams);
  };

  function initAccessControlForm() {
    $('#loadingViewSpinner').show();

    var userDetails = Authentication.getUserDetails();
    var isAdmin = userDetails.role === 1 ? true: false;
    $scope.isAdmin = isAdmin;

    if (isAdmin) {
      $scope.formValues.Ownership = 'administrators';
    }

    $q.all({
      availableTeams: UserService.userTeams(userDetails.ID),
      availableUsers: isAdmin ? UserService.users(false) : []
    })
    .then(function success(data) {
      $scope.availableUsers = data.availableUsers;

      var availableTeams = data.availableTeams;
      $scope.availableTeams = availableTeams;
      if (!isAdmin && availableTeams.length === 1) {
        $scope.formValues.Ownership_Teams = availableTeams;
      }

      $scope.synchronizeFormData();
    })
    .catch(function error(err) {
      Notifications.error('Failure', err, 'Unable to retrieve access control information');
    })
    .finally(function final() {
      $('#loadingViewSpinner').hide();
    });
  }

  initAccessControlForm();
}]);

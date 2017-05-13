angular.module('common.accesscontrol.panel', [])
.controller('AccessControlPanelController', ['$q', '$scope', '$state', 'UserService', 'ResourceControlService', 'Notifications', 'Authentication', 'ModalService', 'ControllerDataPipeline', 'FormValidator',
function ($q, $scope, $state, UserService, ResourceControlService, Notifications, Authentication, ModalService, ControllerDataPipeline, FormValidator) {

  $scope.state = {
    displayAccessControlPanel: false,
    canEditOwnership: false,
    editOwnership: false,
    formValidationError: ''
  };

  $scope.formValues = {
    Ownership: 'public',
    Ownership_Users: [],
    Ownership_Teams: []
  };

  $scope.authorizedUsers = [];
  $scope.availableUsers = [];
  $scope.authorizedTeams = [];
  $scope.availableTeams = [];

  $scope.confirmUpdateOwnership = function (force) {
    if (!validateForm()) {
      return;
    }
    ModalService.confirmVolumeOwnershipChange(function (confirmed) {
      if(!confirmed) { return; }
      updateOwnership();
    });
  };

  function processOwnershipFormValues() {
    var userIds = [];
    angular.forEach($scope.formValues.Ownership_Users, function(user) {
      userIds.push(user.Id);
    });
    var teamIds = [];
    angular.forEach($scope.formValues.Ownership_Teams, function(team) {
      teamIds.push(team.Id);
    });
    var administratorsOnly = $scope.formValues.Ownership === 'administrators' ? true : false;

    return {
      ownership: $scope.formValues.Ownership,
      authorizedUserIds: administratorsOnly ? [] : userIds,
      authorizedTeamIds: administratorsOnly ? [] : teamIds,
      administratorsOnly: administratorsOnly
    };
  }

  function validateForm() {
    $scope.state.formValidationError = '';
    var error = '';

    var accessControlData = {
      ownership: $scope.formValues.Ownership,
      authorizedUsers: $scope.formValues.Ownership_Users,
      authorizedTeams: $scope.formValues.Ownership_Teams
    };
    var isAdmin = $scope.isAdmin;
    error = FormValidator.validateAccessControl(accessControlData, isAdmin);
    if (error) {
      $scope.state.formValidationError = error;
      return false;
    }
    return true;
  }

  function updateOwnership() {
    $('#loadingViewSpinner').show();

    var accessControlData = ControllerDataPipeline.getAccessControlData();
    var resourceId = accessControlData.resourceId;
    var ownershipParameters = processOwnershipFormValues();

    ResourceControlService.applyResourceControlChange(accessControlData.resourceType, resourceId,
      $scope.resourceControl, ownershipParameters)
    .then(function success(data) {
      Notifications.success('Volume ownership successfully updated');
      $state.reload();
    })
    .catch(function error(err) {
      Notifications.error('Failure', err, 'Unable to update volume ownership');
    })
    .finally(function final() {
      $('#loadingViewSpinner').hide();
    });
  }

  function initAccessControlPanel() {
    $('#loadingViewSpinner').show();

    var userDetails = Authentication.getUserDetails();
    var isAdmin = userDetails.role === 1 ? true: false;
    var userId = userDetails.ID;
    $scope.isAdmin = isAdmin;

    var accessControlData = ControllerDataPipeline.getAccessControlData();
    var resourceControl = accessControlData.resourceControl;
    $scope.resourceType = accessControlData.resourceType;
    $scope.resourceControl = resourceControl;

    if (isAdmin) {
      if (resourceControl) {
        $scope.formValues.Ownership = resourceControl.Ownership === 'private' ? 'restricted' : resourceControl.Ownership;
      } else {
        $scope.formValues.Ownership = 'public';
      }
    } else {
      $scope.formValues.Ownership = 'public';
    }

    ResourceControlService.retrieveOwnershipDetails(resourceControl)
    .then(function success(data) {
      $scope.authorizedUsers = data.authorizedUsers;
      $scope.authorizedTeams = data.authorizedTeams;
      return ResourceControlService.retrieveUserPermissionsOnResource(userId, isAdmin, resourceControl);
    })
    .then(function success(data) {
      $scope.state.canEditOwnership = data.isPartOfRestrictedUsers || data.isLeaderOfAnyRestrictedTeams;
      $scope.state.canChangeOwnershipToTeam = data.isPartOfRestrictedUsers;

      return $q.all({
        availableUsers: isAdmin ? UserService.users(false) : [],
        availableTeams: isAdmin || data.isPartOfRestrictedUsers ? UserService.userTeams(userId) : []
      });
    })
    .then(function success(data) {
      $scope.availableUsers = data.availableUsers;
      angular.forEach($scope.availableUsers, function(user) {
        var found = _.find($scope.authorizedUsers, { Id: user.Id });
        if (found) {
          user.selected = true;
        }
      });
      $scope.availableTeams = data.availableTeams;
      angular.forEach(data.availableTeams, function(team) {
        var found = _.find($scope.authorizedTeams, { Id: team.Id });
        if (found) {
          team.selected = true;
        }
      });
      if (data.availableTeams.length === 1) {
        $scope.formValues.Ownership_Teams.push(data.availableTeams[0]);
      }
      $scope.state.displayAccessControlPanel = true;
    })
    .catch(function error(err) {
      Notifications.error('Failure', err, 'Unable to retrieve access control information');
    })
    .finally(function final() {
      $('#loadingViewSpinner').hide();
    });
  }

  initAccessControlPanel();
}]);

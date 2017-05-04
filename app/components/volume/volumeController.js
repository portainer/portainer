angular.module('volume', [])
.controller('VolumeController', ['$q', '$scope', '$state', '$stateParams', 'VolumeService', 'UserService', 'ResourceControlService', 'Notifications', 'Authentication',
function ($q, $scope, $state, $stateParams, VolumeService, UserService, ResourceControlService, Notifications, Authentication) {

  $scope.state = {
    editOwnership: false
  };
  $scope.formValues = {
    Ownership_Users: [],
    Ownership_Teams: []
  };
  $scope.isAdmin = false;
  $scope.isOwner = false;
  $scope.isTeamLeader = false;

  $scope.privateOwnership = function() {
    $scope.formValues.Ownership_Users = [];
    $scope.formValues.Ownership_Teams = [];
    var user = _.find($scope.users, {Id: Authentication.getUserDetails().ID});
    if (user) {
      $scope.formValues.Ownership_Users.push(user);
    }
  };

  $scope.restrictedOwnership = function(volume) {
    $scope.formValues.Ownership_Users = [];
    $scope.formValues.Ownership_Teams = [];
    if (volume.Metadata && volume.Metadata.ResourceControl) {
      var resourceControl = volume.Metadata.ResourceControl;
      if ($scope.isAdmin) {
        preloadUsers(resourceControl.Users, $scope.users);
      }
      if (!$scope.isAdmin && $scope.teams.length === 1) {
        $scope.formValues.Ownership_Teams.push($scope.teams[0]);
      } else {
        preloadTeams(resourceControl.Teams, $scope.teams);
      }
    }
  };

  $scope.publicOwnership = function() {
    $scope.formValues.Ownership_Users = [];
    $scope.formValues.Ownership_Teams = [];
  };

  function deleteResourceControl(resourceControlId) {
    $('#loadingViewSpinner').show();
    ResourceControlService.deleteResourceControl(resourceControlId)
    .then(function success() {
      Notifications.success('Success', 'Resource ownership successfully updated');
      $state.reload();
    })
    .catch(function error(err) {
      Notifications.error('Failure', err, 'Unable to update resource ownership');
    })
    .finally(function final() {
      $('#loadingViewSpinner').hide();
    });
  }

  function createResourceControl() {
    $('#loadingViewSpinner').show();
    var users = [];
    var teams = [];
    angular.forEach($scope.formValues.Ownership_Users, function(user) {
      users.push(user.Id);
    });
    angular.forEach($scope.formValues.Ownership_Teams, function(team) {
      teams.push(team.Id);
    });
    ResourceControlService.createResourceControl(users, teams, $scope.volume.Id)
    .then(function success() {
      Notifications.success('Success', 'Resource ownership successfully updated');
      $state.reload();
    })
    .catch(function error(err) {
      Notifications.error('Failure', err, 'Unable to update resource ownership');
    })
    .finally(function final() {
      $('#loadingViewSpinner').hide();
    });
  }

  function updateResourceControl(resourceControlId) {
    $('#loadingViewSpinner').show();
    var users = [];
    var teams = [];
    angular.forEach($scope.formValues.Ownership_Users, function(user) {
      users.push(user.Id);
    });
    angular.forEach($scope.formValues.Ownership_Teams, function(team) {
      teams.push(team.Id);
    });
    ResourceControlService.updateResourceControl(users, teams, resourceControlId)
    .then(function success() {
      Notifications.success('Success', 'Resource ownership successfully updated');
      $state.reload();
    })
    .catch(function error(err) {
      Notifications.error('Failure', err, 'Unable to update resource ownership');
    })
    .finally(function final() {
      $('#loadingViewSpinner').hide();
    });
  }


  $scope.updateOwnership = function(volume) {
    if (volume.Metadata && volume.Metadata.ResourceControl) {
      var resourceControl = volume.Metadata.ResourceControl;
      if ($scope.formValues.Ownership === 'public') {
        deleteResourceControl(resourceControl.Id);
      } else {
        updateResourceControl(resourceControl.Id);
      }
    } else {
      if ($scope.formValues.Ownership !== 'public') {
        createResourceControl();
      }
    }
  };

  $scope.displayEditOwnership = function(volume) {
    if (!$scope.formValues.Ownership) {
      $('#loadingViewSpinner').show();
      $q.all({
        teams: UserService.userTeams(Authentication.getUserDetails().ID),
        users: UserService.users(true)
      })
      .then(function success(data) {
        var teams = data.teams;
        var users = data.users;
        $scope.teams = teams;
        $scope.users = users;
        $scope.state.editOwnership = true;
        preloadOwnership(volume, users, teams);
      })
      .catch(function error(err) {
        Notifications.error('Failure', err, 'Unable to retrieve user and team information');
      })
      .finally(function final() {
        $('#loadingViewSpinner').hide();
      });
    } else {
      $scope.state.editOwnership = true;
    }
  };

  $scope.removeVolume = function removeVolume() {
    $('#loadingViewSpinner').show();
    VolumeService.remove($scope.volume)
    .then(function success(data) {
      Notifications.success('Volume successfully removed', $stateParams.id);
      $state.go('volumes', {});
    })
    .catch(function error(err) {
      Notifications.error('Failure', err, 'Unable to remove volume');
    })
    .finally(function final() {
      $('#loadingViewSpinner').hide();
    });
  };

  function preloadUsers(owners, users) {
    for (var i = 0; i < owners.length; i++) {
      var user = _.find(users, {Id: owners[i]});
      if (user) {
        user.ticked = true;
        $scope.formValues.Ownership_Users.push(user);
      }
    }
  }

  function preloadTeams(owners, teams) {
    for (var i = 0; i < owners.length; i++) {
      var team = _.find(teams, {Id: owners[i]});
      if (team) {
        team.ticked = true;
        $scope.formValues.Ownership_Teams.push(team);
      }
    }
  }

  function preloadOwnership(volume, users, teams) {
    if (volume.Metadata && volume.Metadata.ResourceControl) {
      var resourceControl = volume.Metadata.ResourceControl;
      if (resourceControl.Users.length === 1 && resourceControl.Teams.length === 0) {
        var user = _.find(users, {Id: resourceControl.Users[0]});
        if ((user && user.Role === 1) || $scope.isOwner) {
          $scope.formValues.Ownership = 'private';
        } else {
          $scope.formValues.Ownership = 'restricted';
          preloadUsers(resourceControl.Users, users);
        }
      } else {
        $scope.formValues.Ownership = 'restricted';
        preloadUsers(resourceControl.Users, users);
        preloadTeams(resourceControl.Teams, teams);
      }
    } else {
      $scope.formValues.Ownership = 'public';
    }
  }

  function isUserAllowedToEditOwnership(volume, userID, memberships) {
    if (volume.Metadata && volume.Metadata.ResourceControl) {
      var resourceControl = volume.Metadata.ResourceControl;
      if (_.includes(resourceControl.Users, userID)) {
        $scope.isOwner = true;
      }

      for (var i = 0; i < memberships.length; i++) {
        if (memberships[i].Role === 1 && _.includes(resourceControl.Teams, memberships[i].TeamId)) {
          $scope.isTeamLeader = true;
          break;
        }
      }
    }
  }

  function initView() {
    $('#loadingViewSpinner').show();
    var userDetails = Authentication.getUserDetails();
    var userId = userDetails.ID;
    var isAdmin = userDetails.role === 1 ? true: false;
    $scope.isAdmin = isAdmin;
    $q.all({
      volume: VolumeService.volume($stateParams.id),
      memberships: UserService.userMemberships(userId)
    })
    .then(function success(data) {
      var volume = data.volume;
      $scope.volume = volume;
      isUserAllowedToEditOwnership(volume, userId, data.memberships);
    })
    .catch(function error(err) {
      Notifications.error('Failure', err, 'Unable to retrieve volume details');
    })
    .finally(function final() {
      $('#loadingViewSpinner').hide();
    });
  }

  initView();
}]);

angular.module('teams', [])
.controller('TeamsController', ['$q', '$scope', '$state', 'TeamService', 'UserService', 'TeamMembershipService', 'ModalService', 'Notifications', 'Authentication',
function ($q, $scope, $state, TeamService, UserService, TeamMembershipService, ModalService, Notifications, Authentication) {
  $scope.state = {
    userGroupGroupCreationError: '',
    validName: false
  };

  $scope.formValues = {
    Name: '',
    Leaders: []
  };

  $scope.checkNameValidity = function() {
    var valid = true;
    for (var i = 0; i < $scope.teams.length; i++) {
      if ($scope.formValues.Name === $scope.teams[i].Name) {
        valid = false;
        break;
      }
    }
    $scope.state.validName = valid;
    $scope.state.teamCreationError = valid ? '' : 'Team name already existing';
  };

  $scope.addTeam = function() {
    $('#createTeamSpinner').show();
    $scope.state.teamCreationError = '';
    var teamName = $scope.formValues.Name;
    var leaderIds = [];
    angular.forEach($scope.formValues.Leaders, function(user) {
      leaderIds.push(user.Id);
    });

    TeamService.createTeam(teamName, leaderIds)
    .then(function success(data) {
      Notifications.success('Team successfully created', teamName);
      $state.reload();
    })
    .catch(function error(err) {
      Notifications.error('Failure', err, 'Unable to create team');
    })
    .finally(function final() {
      $('#createTeamSpinner').hide();
    });
  };

  function deleteSelectedTeams(teams) {
    $('#loadingViewSpinner').show();
    var counter = 0;
    var complete = function () {
      counter = counter - 1;
      if (counter === 0) {
        $('#loadingViewSpinner').hide();
      }
      $state.reload();
    };
    angular.forEach(teams, function (team) {
      counter = counter + 1;
      TeamService.deleteTeam(team.Id)
      .then(function success(data) {
        var index = $scope.teams.indexOf(team);
        $scope.teams.splice(index, 1);
        Notifications.success('Team successfully deleted', team.Name);
      })
      .catch(function error(err) {
        Notifications.error('Failure', err, 'Unable to remove team');
      })
      .finally(function final() {
        complete();
      });
    });
  }

  $scope.removeAction = function (items) {
    ModalService.confirmDeletion(
      'Do you want to delete the selected team(s)? Users in the team(s) will not be deleted.',
      function onConfirm(confirmed) {
        if(!confirmed) { return; }
        deleteSelectedTeams(items);
      }
    );
  };

  function initView() {
    $('#loadingViewSpinner').show();
    var userDetails = Authentication.getUserDetails();
    var isAdmin = userDetails.role === 1 ? true: false;
    $scope.isAdmin = isAdmin;
    $q.all({
      users: UserService.users(false),
      teams: isAdmin ? TeamService.teams() : UserService.userLeadingTeams(userDetails.ID)
    })
    .then(function success(data) {
      $scope.teams = data.teams;
      $scope.users = data.users;
    })
    .catch(function error(err) {
      $scope.teams = [];
      $scope.users = [];
      Notifications.error('Failure', err, 'Unable to retrieve teams');
    })
    .finally(function final() {
      $('#loadingViewSpinner').hide();
    });
  }

  initView();
}]);

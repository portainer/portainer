angular.module('teams', [])
.controller('TeamsController', ['$q', '$scope', '$state', 'TeamService', 'UserService', 'TeamMembershipService', 'ModalService', 'Notifications', 'Pagination', 'Authentication',
function ($q, $scope, $state, TeamService, UserService, TeamMembershipService, ModalService, Notifications, Pagination, Authentication) {
  $scope.state = {
    userGroupGroupCreationError: '',
    selectedItemCount: 0,
    validName: false,
    pagination_count: Pagination.getPaginationCount('teams'),
    deploymentInProgress: false
  };
  $scope.sortType = 'Name';
  $scope.sortReverse = false;

  $scope.formValues = {
    Name: '',
    Leaders: []
  };

  $scope.order = function(sortType) {
    $scope.sortReverse = ($scope.sortType === sortType) ? !$scope.sortReverse : false;
    $scope.sortType = sortType;
  };

  $scope.changePaginationCount = function() {
    Pagination.setPaginationCount('teams', $scope.state.pagination_count);
  };

  $scope.selectItems = function (allSelected) {
    angular.forEach($scope.state.filteredTeams, function (team) {
      if (team.Checked !== allSelected) {
        team.Checked = allSelected;
        $scope.selectItem(team);
      }
    });
  };

  $scope.selectItem = function (item) {
    if (item.Checked) {
      $scope.state.selectedItemCount++;
    } else {
      $scope.state.selectedItemCount--;
    }
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
    $scope.state.deploymentInProgress = true;
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
      $scope.state.deploymentInProgress = false;
    });
  };

  function deleteSelectedTeams() {
    angular.forEach($scope.teams, function (team) {
      if (team.Checked) {
        TeamService.deleteTeam(team.Id)
        .then(function success(data) {
          var index = $scope.teams.indexOf(team);
          $scope.teams.splice(index, 1);
          Notifications.success('Team successfully deleted', team.Name);
        })
        .catch(function error(err) {
          Notifications.error('Failure', err, 'Unable to remove team');
        });
      }
    });
  }

  $scope.removeAction = function () {
    ModalService.confirmDeletion(
      'Do you want to delete the selected team(s)? Users in the team(s) will not be deleted.',
      function onConfirm(confirmed) {
        if(!confirmed) { return; }
        deleteSelectedTeams();
      }
    );
  };

  function initView() {
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
    });
  }

  initView();
}]);

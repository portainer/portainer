angular.module('teams', [])
.controller('TeamsController', ['$scope', '$state', 'TeamService', 'ModalService', 'Notifications', 'Pagination',
function ($scope, $state, TeamService, ModalService, Notifications, Pagination) {
  $scope.state = {
    userGroupGroupCreationError: '',
    selectedItemCount: 0,
    validName: false,
    pagination_count: Pagination.getPaginationCount('teams')
  };
  $scope.sortType = 'Name';
  $scope.sortReverse = false;

  $scope.formValues = {
    Name: ''
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
    $('#createTeamSpinner').show();
    $scope.state.teamCreationError = '';
    var teamName = $scope.formValues.Name;
    TeamService.createTeam(teamName)
    .then(function success(data) {
      Notifications.success("Team successfully created", teamName);
      $state.reload();
    })
    .catch(function error(err) {
      $scope.state.teamCreationError = err.msg;
    })
    .finally(function final() {
      $('#createTeamSpinner').hide();
    });
  };

  function deleteSelectedTeams() {
    $('#loadingViewSpinner').show();
    var counter = 0;
    var complete = function () {
      counter = counter - 1;
      if (counter === 0) {
        $('#loadingViewSpinner').hide();
      }
    };
    angular.forEach($scope.teams, function (team) {
      if (team.Checked) {
        counter = counter + 1;
        TeamService.deleteTeam(team.Id)
        .then(function success(data) {
          var index = $scope.teams.indexOf(team);
          $scope.teams.splice(index, 1);
          Notifications.success('Team successfully deleted', team.Name);
        })
        .catch(function error(err) {
          Notifications.error("Failure", err, 'Unable to remove team');
        })
        .finally(function final() {
          complete();
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
    $('#loadingViewSpinner').show();
    TeamService.teams()
    .then(function success(data) {
      $scope.teams = data;
    })
    .catch(function error(err) {
      Notifications.error("Failure", err, 'Unable to retrieve teams');
    })
    .finally(function final() {
      $('#loadingViewSpinner').hide();
    });
  }

  initView();
}]);

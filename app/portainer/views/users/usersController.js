import _ from 'lodash-es';
import { AuthenticationMethod } from '@/react/portainer/settings/types';
import { processItemsInBatches } from '@/react/common/processItemsInBatches';

angular.module('portainer.app').controller('UsersController', [
  '$q',
  '$scope',
  '$state',
  'UserService',
  'TeamService',
  'TeamMembershipService',
  'Notifications',
  'Authentication',
  'SettingsService',
  function ($q, $scope, $state, UserService, TeamService, TeamMembershipService, Notifications, Authentication, SettingsService) {
    $scope.state = {
      userCreationError: '',
      validUsername: false,
      actionInProgress: false,
    };

    $scope.formValues = {
      Username: '',
      Password: '',
      ConfirmPassword: '',
      Administrator: false,
      TeamIds: [],
    };

    $scope.handleAdministratorChange = function (checked) {
      return $scope.$evalAsync(() => {
        $scope.formValues.Administrator = checked;
      });
    };

    $scope.onChangeTeamIds = function (teamIds) {
      return $scope.$evalAsync(() => {
        $scope.formValues.TeamIds = teamIds;
      });
    };

    $scope.checkUsernameValidity = function () {
      var valid = true;
      for (var i = 0; i < $scope.users.length; i++) {
        if ($scope.formValues.Username.toLocaleLowerCase() === $scope.users[i].Username.toLocaleLowerCase()) {
          valid = false;
          break;
        }
      }
      $scope.state.validUsername = valid;
      $scope.state.userCreationError = valid ? '' : 'Username already taken';
    };

    $scope.addUser = function () {
      $scope.state.actionInProgress = true;
      $scope.state.userCreationError = '';
      var username = $scope.formValues.Username;
      var password = $scope.formValues.Password;
      var role = $scope.formValues.Administrator ? 1 : 2;
      UserService.createUser(username, password, role, $scope.formValues.TeamIds)
        .then(function success() {
          Notifications.success('User successfully created', username);
          $state.reload();
        })
        .catch(function error(err) {
          Notifications.error('Failure', err, 'Unable to create user');
        })
        .finally(function final() {
          $scope.state.actionInProgress = false;
        });
    };

    async function deleteSelectedUsers(selectedItems) {
      async function doRemove(user) {
        return UserService.deleteUser(user.Id)
          .then(function success() {
            Notifications.success('User successfully removed', user.Username);
            var index = $scope.users.indexOf(user);
            $scope.users.splice(index, 1);
          })
          .catch(function error(err) {
            Notifications.error('Failure', err, 'Unable to remove user');
          });
      }
      await processItemsInBatches(selectedItems, doRemove);
      $state.reload();
    }

    $scope.removeAction = function (selectedItems) {
      return deleteSelectedUsers(selectedItems);
    };

    function assignTeamLeaders(users, memberships) {
      for (var i = 0; i < users.length; i++) {
        var user = users[i];
        user.isTeamLeader = false;
        for (var j = 0; j < memberships.length; j++) {
          var membership = memberships[j];
          if (user.Id === membership.UserId && membership.Role === 1) {
            user.isTeamLeader = true;
            break;
          }
        }
      }
    }

    function initView() {
      var userDetails = Authentication.getUserDetails();
      var isAdmin = Authentication.isAdmin();
      $scope.isAdmin = isAdmin;
      $q.all({
        users: UserService.users(true),
        teams: isAdmin ? TeamService.teams() : UserService.userLeadingTeams(userDetails.ID),
        memberships: TeamMembershipService.memberships(),
        settings: SettingsService.publicSettings(),
      })
        .then(function success(data) {
          $scope.AuthenticationMethod = data.settings.AuthenticationMethod;
          var users = data.users;
          assignTeamLeaders(users, data.memberships);
          users = assignAuthMethod(users, $scope.AuthenticationMethod);
          $scope.users = users;
          $scope.teams = _.orderBy(data.teams, 'Name', 'asc');
          $scope.requiredPasswordLength = data.settings.RequiredPasswordLength;
          $scope.teamSync = data.settings.TeamSync;
        })
        .catch(function error(err) {
          Notifications.error('Failure', err, 'Unable to retrieve users and teams');
          $scope.users = [];
          $scope.teams = [];
        });
    }

    initView();
  },
]);

function assignAuthMethod(users, authMethod) {
  return users.map((u) => ({
    ...u,
    authMethod: AuthenticationMethod[u.Id === 1 ? AuthenticationMethod.Internal : authMethod],
  }));
}

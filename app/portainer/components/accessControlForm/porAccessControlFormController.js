import _ from 'lodash-es';
import { ResourceControlOwnership as RCO } from '@/portainer/access-control/types';

angular.module('portainer.app').controller('porAccessControlFormController', [
  '$q',
  'UserService',
  'TeamService',
  'Notifications',
  'Authentication',
  'ResourceControlService',
  function ($q, UserService, TeamService, Notifications, Authentication, ResourceControlService) {
    var ctrl = this;

    ctrl.RCO = RCO;

    ctrl.availableTeams = [];
    ctrl.availableUsers = [];

    function setOwnership(resourceControl, isAdmin) {
      if (isAdmin && resourceControl.Ownership === RCO.PRIVATE) {
        ctrl.formData.Ownership = RCO.RESTRICTED;
      } else {
        ctrl.formData.Ownership = resourceControl.Ownership;
      }

      if (ctrl.formData.Ownership === RCO.PUBLIC) {
        ctrl.formData.AccessControlEnabled = false;
      }
    }

    function setAuthorizedUsersAndTeams(authorizedUsers, authorizedTeams) {
      angular.forEach(ctrl.availableUsers, function (user) {
        var found = _.find(authorizedUsers, { Id: user.Id });
        if (found) {
          user.selected = true;
        }
      });

      angular.forEach(ctrl.availableTeams, function (team) {
        var found = _.find(authorizedTeams, { Id: team.Id });
        if (found) {
          team.selected = true;
        }
      });
    }

    this.$onInit = $onInit;
    function $onInit() {
      var isAdmin = Authentication.isAdmin();
      ctrl.isAdmin = isAdmin;

      if (isAdmin) {
        ctrl.formData.Ownership = ctrl.RCO.ADMINISTRATORS;
      }

      $q.all({
        availableTeams: TeamService.teams(),
        availableUsers: isAdmin ? UserService.users(false) : [],
      })
        .then(function success(data) {
          ctrl.availableUsers = _.orderBy(data.availableUsers, 'Username', 'asc');

          var availableTeams = _.orderBy(data.availableTeams, 'Name', 'asc');
          ctrl.availableTeams = availableTeams;
          if (!isAdmin && availableTeams.length === 1) {
            ctrl.formData.AuthorizedTeams = availableTeams;
          }

          return $q.when(ctrl.resourceControl && ResourceControlService.retrieveOwnershipDetails(ctrl.resourceControl));
        })
        .then(function success(data) {
          if (data) {
            var authorizedUsers = data.authorizedUsers;
            var authorizedTeams = data.authorizedTeams;
            setOwnership(ctrl.resourceControl, isAdmin);
            setAuthorizedUsersAndTeams(authorizedUsers, authorizedTeams);
          }
        })
        .catch(function error(err) {
          Notifications.error('Failure', err, 'Unable to retrieve access control information');
        });
    }
  },
]);

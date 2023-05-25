import _ from 'lodash-es';
import { ResourceControlOwnership as RCO } from '@/react/portainer/access-control/types';

angular.module('portainer.app').controller('porAccessControlFormController', [
  '$q',
  '$scope',
  '$state',
  'UserService',
  'TeamService',
  'Notifications',
  'Authentication',
  'ResourceControlService',
  function ($q, $scope, $state, UserService, TeamService, Notifications, Authentication, ResourceControlService) {
    var ctrl = this;

    ctrl.RCO = RCO;

    this.onAuthorizedTeamsChange = onAuthorizedTeamsChange.bind(this);
    this.onAuthorizedUsersChange = onAuthorizedUsersChange.bind(this);

    ctrl.availableTeams = [];
    ctrl.availableUsers = [];

    ctrl.onChangeEnablement = onChangeEnablement;
    ctrl.onChangeOwnership = onChangeOwnership;

    function onChangeOwnership(ownership) {
      onChange({ Ownership: ownership });
    }

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
      ctrl.formData.AuthorizedTeams = authorizedTeams;
      ctrl.formData.AuthorizedUsers = authorizedUsers;
    }

    function onAuthorizedTeamsChange(AuthorizedTeams) {
      onChange({ AuthorizedTeams });
    }

    function onAuthorizedUsersChange(AuthorizedUsers) {
      onChange({ AuthorizedUsers });
    }

    function onChange(formData) {
      $scope.$evalAsync(() => {
        ctrl.formData = {
          ...ctrl.formData,
          ...formData,
        };
      });
    }

    this.$onInit = $onInit;
    function $onInit() {
      var isAdmin = Authentication.isAdmin();
      ctrl.isAdmin = isAdmin;

      if (isAdmin) {
        ctrl.formData.Ownership = ctrl.RCO.ADMINISTRATORS;
      }

      const environmentId = $state.params.endpointId;
      $q.all({
        availableTeams: TeamService.teams(environmentId),
        availableUsers: isAdmin ? UserService.users(false, environmentId) : [],
      })
        .then(function success(data) {
          ctrl.availableUsers = _.orderBy(data.availableUsers, 'Username', 'asc');
          ctrl.availableTeams = _.orderBy(data.availableTeams, 'Name', 'asc');
          if (!isAdmin && ctrl.availableTeams.length === 1) {
            ctrl.formData.AuthorizedTeams = ctrl.availableTeams;
          }
          return $q.when(ctrl.resourceControl && ResourceControlService.retrieveOwnershipDetails(ctrl.resourceControl));
        })
        .then(function success(data) {
          if (data) {
            const authorizedTeams = !isAdmin && ctrl.availableTeams.length === 1 ? ctrl.availableTeams : data.authorizedTeams;
            const authorizedUsers = !isAdmin && authorizedTeams.length === 1 ? [] : data.authorizedUsers;
            setOwnership(ctrl.resourceControl, isAdmin);
            setAuthorizedUsersAndTeams(authorizedUsers, authorizedTeams);
          }
        })
        .catch(function error(err) {
          Notifications.error('Failure', err, 'Unable to retrieve access control information');
        });
    }

    function onChangeEnablement(enable) {
      const isAdmin = Authentication.isAdmin();
      onChange({ AccessControlEnabled: enable, Ownership: isAdmin ? RCO.ADMINISTRATORS : RCO.PRIVATE });
    }
  },
]);

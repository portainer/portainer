import _ from 'lodash-es';
import { ResourceControlOwnership as RCO } from 'Portainer/models/resourceControl/resourceControlOwnership';
import { ResourceControlTypeInt as RCTI, ResourceControlTypeString as RCTS } from 'Portainer/models/resourceControl/resourceControlTypes';
import { AccessControlPanelData } from './porAccessControlPanelModel';

angular.module('portainer.app').controller('porAccessControlPanelController', [
  '$q',
  '$state',
  'UserService',
  'TeamService',
  'ResourceControlHelper',
  'ResourceControlService',
  'Notifications',
  'Authentication',
  'ModalService',
  'FormValidator',
  function ($q, $state, UserService, TeamService, ResourceControlHelper, ResourceControlService, Notifications, Authentication, ModalService, FormValidator) {
    var ctrl = this;

    ctrl.RCO = RCO;
    ctrl.RCTS = RCTS;
    ctrl.RCTI = RCTI;
    ctrl.state = {
      displayAccessControlPanel: false,
      canEditOwnership: false,
      editOwnership: false,
      formValidationError: '',
    };

    ctrl.formValues = new AccessControlPanelData();

    ctrl.authorizedUsers = [];
    ctrl.availableUsers = [];
    ctrl.authorizedTeams = [];
    ctrl.availableTeams = [];

    ctrl.canEditOwnership = function () {
      const hasRC = ctrl.resourceControl;
      const inheritedVolume = hasRC && ctrl.resourceControl.Type === RCTI.CONTAINER && ctrl.resourceType === RCTS.VOLUME;
      const inheritedContainer = hasRC && ctrl.resourceControl.Type === RCTI.SERVICE && ctrl.resourceType === RCTS.CONTAINER;
      const inheritedFromStack = hasRC && ctrl.resourceControl.Type === RCTI.STACK && ctrl.resourceType !== RCTS.STACK;
      const hasSpecialDisable = ctrl.disableOwnershipChange;

      return !inheritedVolume && !inheritedContainer && !inheritedFromStack && !hasSpecialDisable && !ctrl.state.editOwnership && (ctrl.isAdmin || ctrl.state.canEditOwnership);
    };

    ctrl.confirmUpdateOwnership = function () {
      if (!validateForm()) {
        return;
      }
      ModalService.confirmAccessControlUpdate(function (confirmed) {
        if (!confirmed) {
          return;
        }
        updateOwnership();
      });
    };

    function validateForm() {
      ctrl.state.formValidationError = '';
      var error = '';

      var accessControlData = {
        AccessControlEnabled: ctrl.formValues.Ownership === RCO.PUBLIC ? false : true,
        Ownership: ctrl.formValues.Ownership,
        AuthorizedUsers: ctrl.formValues.Ownership_Users,
        AuthorizedTeams: ctrl.formValues.Ownership_Teams,
      };
      var isAdmin = ctrl.isAdmin;
      error = FormValidator.validateAccessControl(accessControlData, isAdmin);
      if (error) {
        ctrl.state.formValidationError = error;
        return false;
      }
      return true;
    }

    function updateOwnership() {
      ResourceControlService.applyResourceControlChange(ctrl.resourceType, ctrl.resourceId, ctrl.resourceControl, ctrl.formValues)
        .then(function success() {
          Notifications.success('Access control successfully updated');
          $state.reload();
        })
        .catch(function error(err) {
          Notifications.error('Failure', err, 'Unable to update access control');
        });
    }

    this.$onInit = $onInit;
    function $onInit() {
      var userDetails = Authentication.getUserDetails();
      var isAdmin = Authentication.isAdmin();
      var userId = userDetails.ID;
      ctrl.isAdmin = isAdmin;
      var resourceControl = ctrl.resourceControl;

      if (isAdmin && resourceControl) {
        ctrl.formValues.Ownership = resourceControl.Ownership === RCO.PRIVATE ? RCO.RESTRICTED : resourceControl.Ownership;
      } else {
        ctrl.formValues.Ownership = RCO.ADMINISTRATORS;
      }

      ResourceControlService.retrieveOwnershipDetails(resourceControl)
        .then(function success(data) {
          ctrl.authorizedUsers = data.authorizedUsers;
          ctrl.authorizedTeams = data.authorizedTeams;
          return ResourceControlService.retrieveUserPermissionsOnResource(userId, isAdmin, resourceControl);
        })
        .then(function success(data) {
          ctrl.state.canEditOwnership = data.isPartOfRestrictedUsers || data.isLeaderOfAnyRestrictedTeams;
          ctrl.state.canChangeOwnershipToTeam = data.isPartOfRestrictedUsers;

          return $q.all({
            availableUsers: isAdmin ? UserService.users(false) : [],
            availableTeams: isAdmin || data.isPartOfRestrictedUsers ? TeamService.teams() : [],
          });
        })
        .then(function success(data) {
          ctrl.availableUsers = _.orderBy(data.availableUsers, 'Username', 'asc');
          angular.forEach(ctrl.availableUsers, function (user) {
            var found = _.find(ctrl.authorizedUsers, { Id: user.Id });
            if (found) {
              user.selected = true;
            }
          });
          ctrl.availableTeams = _.orderBy(data.availableTeams, 'Name', 'asc');
          angular.forEach(data.availableTeams, function (team) {
            var found = _.find(ctrl.authorizedTeams, { Id: team.Id });
            if (found) {
              team.selected = true;
            }
          });
          if (data.availableTeams.length === 1) {
            ctrl.formValues.Ownership_Teams.push(data.availableTeams[0]);
          }
          ctrl.state.displayAccessControlPanel = true;
        })
        .catch(function error(err) {
          Notifications.error('Failure', err, 'Unable to retrieve access control information');
        });
    }
  },
]);

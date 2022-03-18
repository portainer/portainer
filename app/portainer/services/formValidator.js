import { ResourceControlOwnership as RCO } from '@/portainer/access-control/types';

angular.module('portainer.app').factory('FormValidator', [
  function FormValidatorFactory() {
    'use strict';

    var validator = {};

    validator.validateAccessControl = function (accessControlData, isAdmin) {
      if (!accessControlData.AccessControlEnabled) {
        return '';
      }

      if (isAdmin && accessControlData.Ownership === RCO.RESTRICTED && accessControlData.AuthorizedUsers.length === 0 && accessControlData.AuthorizedTeams.length === 0) {
        return 'You must specify at least one team or user.';
      } else if (!isAdmin && accessControlData.Ownership === RCO.RESTRICTED && accessControlData.AuthorizedTeams.length === 0) {
        return 'You must specify at least a team.';
      }
      return '';
    };

    return validator;
  },
]);

import { ResourceControlOwnership as RCO } from '@/react/portainer/access-control/types';
import i18n from '@/i18n';

angular.module('portainer.app').factory('FormValidator', [
  function FormValidatorFactory() {
    'use strict';

    var validator = {};

    validator.validateAccessControl = function (accessControlData, isAdmin) {
      if (!accessControlData.AccessControlEnabled) {
        return '';
      }

      if (isAdmin && accessControlData.Ownership === RCO.RESTRICTED && accessControlData.AuthorizedUsers.length === 0 && accessControlData.AuthorizedTeams.length === 0) {
        return i18n.t('portainer_access.must_specify_team_or_user');
      } else if (!isAdmin && accessControlData.Ownership === RCO.RESTRICTED && accessControlData.AuthorizedTeams.length === 0) {
        return i18n.t('portainer_access.must_specify_team');
      }
      return '';
    };

    return validator;
  },
]);

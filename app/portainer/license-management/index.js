import angular from 'angular';

import { License } from './license.rest';
import { LicenseService } from './license.service';
import licensesViewModule from './licenses.view';
import addLicenseViewModule from './add-license.view';

import { licenseNodePanel } from './license-node-panel.component';
import { licenseExpirationPanel } from './license-expiration-panel.component';

export default angular
  .module('portainer.app.license-management', [licensesViewModule, addLicenseViewModule])
  .config(config)
  .service('License', License)
  .service('LicenseService', LicenseService)
  .component('licenseExpirationPanel', licenseExpirationPanel)
  .component('licenseNodePanel', licenseNodePanel).name;

/* @ngInject */
function config($stateRegistryProvider) {
  const licenses = {
    name: 'portainer.licenses',
    url: '/licenses',
    views: {
      'content@': {
        component: 'licensesView',
      },
    },
    onEnter: /* @ngInject */ function onEnter($async, $state, Authentication) {
      return $async(async () => {
        if (!Authentication.isAdmin()) {
          return $state.go('portainer.home');
        }
      });
    },
  };

  const addLicense = {
    name: 'portainer.licenses.new',
    url: '/licenses/new',
    views: {
      'content@': {
        component: 'addLicenseView',
      },
    },
  };

  $stateRegistryProvider.register(licenses);
  $stateRegistryProvider.register(addLicense);
}

import angular from 'angular';

import { NetworkProfileModel } from '@/azure/models/networkProfile';

angular.module('portainer.azure').service('NetworkProfileService', NetworkProfileServiceFactory);

/* @ngInject */
function NetworkProfileServiceFactory(NetworkProfile) {
  return {
    networkProfiles,
  };

  async function networkProfiles(subscriptionId) {
    const response = await NetworkProfile.query({ subscriptionId }).$promise;
    return response.value.map((network) => new NetworkProfileModel(network));
  }
}

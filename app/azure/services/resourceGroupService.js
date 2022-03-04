import { ResourceGroupViewModel } from '../models/resource_group';

angular.module('portainer.azure').factory('ResourceGroupService', [
  '$q',
  'ResourceGroup',
  function ResourceGroupServiceFactory($q, ResourceGroup) {
    'use strict';
    var service = {};

    service.resourceGroup = resourceGroup;
    async function resourceGroup(subscriptionId, resourceGroupName) {
      const group = await ResourceGroup.get({ subscriptionId, resourceGroupName }).$promise;
      return new ResourceGroupViewModel(group);
    }

    return service;
  },
]);

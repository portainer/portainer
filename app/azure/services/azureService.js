import { ResourceGroupViewModel } from '../models/resource_group';
import { SubscriptionViewModel } from '../models/subscription';
import { getResourceGroups } from './resource-groups.service';
import { getSubscriptions } from './subscription.service';

angular.module('portainer.azure').factory('AzureService', AzureService);

/* @ngInject */
export function AzureService($q, Azure, $async, EndpointProvider, ContainerGroupService) {
  'use strict';
  var service = {};

  service.deleteContainerGroup = function (id) {
    return Azure.delete(id, '2018-04-01');
  };

  service.subscriptions = async function subscriptions() {
    return $async(async () => {
      const environmentId = EndpointProvider.endpointID();
      const subscriptions = await getSubscriptions(environmentId);
      return subscriptions.map((s) => new SubscriptionViewModel(s));
    });
  };

  service.resourceGroups = function resourceGroups(subscriptions) {
    return $async(async () => {
      return retrieveResourcesForEachSubscription(subscriptions, async (subscriptionId) => {
        const environmentId = EndpointProvider.endpointID();

        const resourceGroups = await getResourceGroups(environmentId, subscriptionId);
        return resourceGroups.map((r) => new ResourceGroupViewModel(r, subscriptionId));
      });
    });
  };

  service.containerGroups = function (subscriptions) {
    return retrieveResourcesForEachSubscription(subscriptions, ContainerGroupService.containerGroups);
  };

  service.aggregate = function (resourcesBySubscription) {
    var aggregatedResources = [];
    Object.keys(resourcesBySubscription).forEach(function (key) {
      aggregatedResources = aggregatedResources.concat(resourcesBySubscription[key]);
    });
    return aggregatedResources;
  };

  function retrieveResourcesForEachSubscription(subscriptions, resourceQuery) {
    var deferred = $q.defer();

    var resources = {};

    var resourceQueries = [];
    for (var i = 0; i < subscriptions.length; i++) {
      var subscription = subscriptions[i];
      resourceQueries.push(resourceQuery(subscription.Id));
    }

    $q.all(resourceQueries)
      .then(function success(data) {
        for (var i = 0; i < data.length; i++) {
          var result = data[i];
          resources[subscriptions[i].Id] = result;
        }
        deferred.resolve(resources);
      })
      .catch(function error(err) {
        deferred.reject({ msg: 'Unable to retrieve resources', err: err });
      });

    return deferred.promise;
  }

  return service;
}

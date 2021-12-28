// import { ContainerInstanceProviderViewModel } from '../models/provider';

import { EnvironmentId } from '@/portainer/environments/types';
import axios, { parseAxiosError } from '@/portainer/services/axios';

import { ContainerInstanceProviderViewModel } from '../models/provider';
import { Provider } from '../types';

import { azureErrorParser } from './utils';

// angular.module('portainer.azure').factory('ProviderService', [
//   '$q',
//   'Provider',
//   function ProviderServiceFactory($q, Provider) {
//     'use strict';
//     var service = {};

//     service.containerInstanceProvider = function (subscriptionId) {
//       var deferred = $q.defer();

//       Provider.get({ subscriptionId: subscriptionId, providerNamespace: 'Microsoft.ContainerInstance' })
//         .$promise.then(function success(data) {
//           var provider = new ContainerInstanceProviderViewModel(data);
//           deferred.resolve(provider);
//         })
//         .catch(function error(err) {
//           deferred.reject({ msg: 'Unable to retrieve provider', err: err });
//         });

//       return deferred.promise;
//     };

//     return service;
//   },
// ]);

/*
angular.module('portainer.azure').factory('Provider', [
  '$resource',
  'API_ENDPOINT_ENDPOINTS',
  'EndpointProvider',
  function ProviderFactory($resource, API_ENDPOINT_ENDPOINTS, EndpointProvider) {
    'use strict';
    return $resource(
      API_ENDPOINT_ENDPOINTS + '/:endpointId/azure/subscriptions/:subscriptionId/providers/:providerNamespace',
      {
        endpointId: EndpointProvider.endpointID,
        'api-version': '2018-02-01',
      },
      {
        get: { method: 'GET', params: { subscriptionId: '@subscriptionId', providerNamespace: '@providerNamespace' } },
      }
    );
  },
]);
*/

export async function getContainerInstanceProviders(
  environmentId: EnvironmentId,
  subscriptionId: string
) {
  try {
    const url = `/endpoints/${environmentId}/azure/subscriptions/${subscriptionId}/providers/Microsoft.ContainerInstance`;
    const { data } = await axios.get<Provider>(url, {
      params: { 'api-version': '2018-02-01' },
    });

    return new ContainerInstanceProviderViewModel(data);
  } catch (error) {
    throw parseAxiosError(
      error as Error,
      'Unable to retrieve provider',
      azureErrorParser
    );
  }
}

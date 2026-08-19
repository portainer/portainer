import angular from 'angular';
import { getEnvironments } from '@/react/portainer/environments/environment.service';

angular.module('portainer.app').factory('NameValidator', NameValidatorFactory);
/* @ngInject */
function NameValidatorFactory(Notifications) {
  return {
    validateEnvironmentName,
  };

  async function validateEnvironmentName(name) {
    try {
      const endpoints = await getEnvironments({ limit: 1, name });
      return endpoints.value.length > 0;
    } catch (err) {
      Notifications.error('Failure', err, 'Unable to retrieve environment details');
    }
  }
}

import angular from 'angular';

angular.module('portainer.app').factory('NameValidator', NameValidatorFactory);
/* @ngInject */
function NameValidatorFactory(EndpointService, Notifications) {
  return {
    validateEnvironmentName,
  };

  async function validateEnvironmentName(environmentName) {
    try {
      const result = await EndpointService.endpoints(0, undefined, { search: environmentName });
      return result.totalCount > 0;
    } catch (err) {
      Notifications.error('Failure', err, 'Unable to retrieve environment details');
    }
  }
}
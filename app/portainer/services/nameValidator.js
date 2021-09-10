import angular from 'angular';

angular.module('portainer.app').factory('NameValidator', NameValidatorFactory);
/* @ngInject */
function NameValidatorFactory(EndpointService, Notifications) {
  return {
    validateEnvironmentName,
  };

  async function validateEnvironmentName(environmentName) {
    try {
      const endpoints = await EndpointService.endpoints();
      const endpointArray = endpoints.value;
      const nameDuplicated = endpointArray.filter((item) => item.Name === environmentName);
      return nameDuplicated.length > 0;
    } catch (err) {
      Notifications.error('Failure', err, 'Unable to retrieve environment details');
    }
  }
}

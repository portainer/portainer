import angular from 'angular';

class EdgeGroupFormController {
  /* @ngInject */
  constructor(EndpointService, $async) {
    this.EndpointService = EndpointService;
    this.$async = $async;

    this.searchEndpoints = this.searchEndpoints.bind(this);
    this.searchEndpointsAsync = this.searchEndpointsAsync.bind(this);
  }

  async $onInit() {
    const endpoints = await this.searchEndpointsAsync();
    if (!endpoints.length) {
      this.noEndpoints = true;
    }
  }

  searchEndpoints(search) {
    return this.$async(this.searchEndpointsAsync, search);
  }

  async searchEndpointsAsync(search) {
    const response = await this.EndpointService.endpoints(0, 10, { search, type: 4 });
    this.endpoints = response.value;
    return this.endpoints;
  }
}

angular.module('portainer.edge').controller('EdgeGroupFormController', EdgeGroupFormController);
export default EdgeGroupFormController;

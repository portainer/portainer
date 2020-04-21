import angular from 'angular';
import _ from 'lodash-es';

class EdgeGroupFormController {
  /* @ngInject */
  constructor(EndpointService, $async) {
    this.EndpointService = EndpointService;
    this.$async = $async;

    this.state = {
      available: {
        limit: '10',
        filter: '',
        pageNumber: 1,
        totalCount: 0,
      },
      associated: {
        limit: '10',
        filter: '',
        pageNumber: 1,
        totalCount: 0,
      },
    };

    this.endpoints = {
      associated: [],
      available: null,
    };

    this.associateEndpoint = this.associateEndpoint.bind(this);
    this.dissociateEndpoint = this.dissociateEndpoint.bind(this);
    this.getPaginatedEndpointsAsync = this.getPaginatedEndpointsAsync.bind(this);
    this.getPaginatedEndpoints = this.getPaginatedEndpoints.bind(this);
  }

  associateEndpoint(endpoint) {
    if (!_.includes(this.model.Endpoints, endpoint.Id)) {
      this.endpoints.associated.push(endpoint);
      this.model.Endpoints.push(endpoint.Id);
    }
  }

  dissociateEndpoint({ Id }) {
    _.remove(this.endpoints.associated, { Id });
    _.remove(this.model.Endpoints, (eid) => eid === Id);
  }

  getPaginatedEndpoints(pageType, tableType) {
    return this.$async(this.getPaginatedEndpointsAsync, pageType, tableType);
  }

  async getPaginatedEndpointsAsync(_, tableType) {
    const { pageNumber, limit, search } = this.state[tableType];
    const start = (pageNumber - 1) * limit + 1;
    const query = { search, type: 4 };
    if (tableType === 'associated') {
      query.endpointIds = this.model.Endpoints;
    }
    const { value, totalCount } = await this.EndpointService.endpoints(start, limit, query);
    this.endpoints[tableType] = value;
    this.state[tableType].totalCount = totalCount;
    if (tableType === 'available' && totalCount === 0) {
      this.noEndpoints = true;
    }
  }
}

angular.module('portainer.edge').controller('EdgeGroupFormController', EdgeGroupFormController);
export default EdgeGroupFormController;

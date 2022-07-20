import angular from 'angular';
import _ from 'lodash-es';

import { EdgeTypes } from '@/portainer/environments/types';
import { getEnvironments } from '@/portainer/environments/environment.service';

class AssoicatedEndpointsSelectorController {
  /* @ngInject */
  constructor($async) {
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

    this.getAvailableEndpoints = this.getAvailableEndpoints.bind(this);
    this.getAssociatedEndpoints = this.getAssociatedEndpoints.bind(this);
    this.associateEndpoint = this.associateEndpoint.bind(this);
    this.dissociateEndpoint = this.dissociateEndpoint.bind(this);
    this.loadData = this.loadData.bind(this);
  }

  $onInit() {
    this.loadData();
  }

  $onChanges({ endpointIds }) {
    if (endpointIds && endpointIds.currentValue) {
      this.loadData();
    }
  }

  loadData() {
    this.getAvailableEndpoints();
    this.getAssociatedEndpoints();
  }

  /* #region  internal queries to retrieve endpoints per "side" of the selector */
  getAvailableEndpoints() {
    return this.$async(async () => {
      const { start, search, limit } = this.getPaginationData('available');
      const query = { search, types: EdgeTypes };

      const response = await getEnvironments({ start, limit, query });

      const endpoints = _.filter(response.value, (endpoint) => !_.includes(this.endpointIds, endpoint.Id));
      this.setTableData('available', endpoints, response.totalCount);
      this.noEndpoints = this.state.available.totalCount === 0;
    });
  }

  getAssociatedEndpoints() {
    return this.$async(async () => {
      let response = { value: [], totalCount: 0 };
      if (this.endpointIds.length > 0) {
        // fetch only if already has associated endpoints
        const { start, search, limit } = this.getPaginationData('associated');
        const query = { search, types: EdgeTypes, endpointIds: this.endpointIds };

        response = await getEnvironments({ start, limit, query });
      }

      this.setTableData('associated', response.value, response.totalCount);
    });
  }
  /* #endregion */

  /* #region  On endpoint click (either available or associated) */
  associateEndpoint(endpoint) {
    this.onAssociate(endpoint);
  }

  dissociateEndpoint(endpoint) {
    this.onDissociate(endpoint);
  }
  /* #endregion */

  /* #region  Utils funcs */
  getPaginationData(tableType) {
    const { pageNumber, limit, search } = this.state[tableType];
    const start = (pageNumber - 1) * limit + 1;

    return { start, search, limit };
  }

  setTableData(tableType, endpoints, totalCount) {
    this.endpoints[tableType] = endpoints;
    this.state[tableType].totalCount = parseInt(totalCount, 10);
  }
  /* #endregion */
}

angular.module('portainer.app').controller('AssoicatedEndpointsSelectorController', AssoicatedEndpointsSelectorController);
export default AssoicatedEndpointsSelectorController;

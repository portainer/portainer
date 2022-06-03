import _ from 'lodash-es';
import { confirmAsync } from '@/portainer/services/modal.service/confirm';

export class EdgeGroupFormController {
  /* @ngInject */
  constructor(EndpointService, $async, $scope) {
    this.EndpointService = EndpointService;
    this.$async = $async;
    this.$scope = $scope;

    this.endpoints = {
      state: {
        limit: '10',
        filter: '',
        pageNumber: 1,
        totalCount: 0,
      },
      value: null,
    };

    this.associateEndpoint = this.associateEndpoint.bind(this);
    this.dissociateEndpointAsync = this.dissociateEndpointAsync.bind(this);
    this.dissociateEndpoint = this.dissociateEndpoint.bind(this);
    this.getDynamicEndpointsAsync = this.getDynamicEndpointsAsync.bind(this);
    this.getDynamicEndpoints = this.getDynamicEndpoints.bind(this);
    this.onChangeTags = this.onChangeTags.bind(this);

    $scope.$watch(
      () => this.model,
      () => {
        if (this.model.Dynamic) {
          this.getDynamicEndpoints();
        }
      },
      true
    );
  }

  onChangeTags(value) {
    return this.$scope.$evalAsync(() => {
      this.model.TagIds = value;
    });
  }

  associateEndpoint(endpoint) {
    if (!_.includes(this.model.Endpoints, endpoint.Id)) {
      this.model.Endpoints = [...this.model.Endpoints, endpoint.Id];
    }
  }

  dissociateEndpoint(endpoint) {
    return this.$async(this.dissociateEndpointAsync, endpoint);
  }

  async dissociateEndpointAsync(endpoint) {
    const confirmed = await confirmAsync({
      title: 'Confirm action',
      message: 'Removing the environment from this group will remove its corresponding edge stacks',
      buttons: {
        cancel: {
          label: 'Cancel',
          className: 'btn-default',
        },
        confirm: {
          label: 'Confirm',
          className: 'btn-primary',
        },
      },
    });

    if (!confirmed) {
      return;
    }

    this.model.Endpoints = _.filter(this.model.Endpoints, (id) => id !== endpoint.Id);
  }

  getDynamicEndpoints() {
    return this.$async(this.getDynamicEndpointsAsync);
  }

  async getDynamicEndpointsAsync() {
    const { pageNumber, limit, search } = this.endpoints.state;
    const start = (pageNumber - 1) * limit + 1;
    const query = { search, types: [4, 7], tagIds: this.model.TagIds, tagsPartialMatch: this.model.PartialMatch };

    const response = await this.EndpointService.endpoints(start, limit, query);

    const totalCount = parseInt(response.totalCount, 10);
    this.endpoints.value = response.value;
    this.endpoints.state.totalCount = totalCount;
  }
}

import _ from 'lodash-es';
import { confirmDestructive } from '@@/modals/confirm';
import { EdgeTypes } from '@/react/portainer/environments/types';
import { getEnvironments } from '@/react/portainer/environments/environment.service';
import { getTags } from '@/portainer/tags/tags.service';
import { notifyError } from '@/portainer/services/notifications';
import { buildConfirmButton } from '@@/modals/utils';
import { tagOptions } from '@/react/edge/edge-groups/CreateView/tag-options';
import { groupTypeOptions } from '@/react/edge/edge-groups/CreateView/group-type-options';

export class EdgeGroupFormController {
  /* @ngInject */
  constructor($async, $scope) {
    this.$async = $async;
    this.$scope = $scope;

    this.groupTypeOptions = groupTypeOptions;
    this.tagOptions = tagOptions;

    this.endpoints = {
      state: {
        limit: '10',
        filter: '',
        pageNumber: 1,
        totalCount: 0,
      },
      value: null,
    };

    this.tags = [];

    this.associateEndpoint = this.associateEndpoint.bind(this);
    this.dissociateEndpoint = this.dissociateEndpoint.bind(this);
    this.getDynamicEndpointsAsync = this.getDynamicEndpointsAsync.bind(this);
    this.getDynamicEndpoints = this.getDynamicEndpoints.bind(this);
    this.onChangeTags = this.onChangeTags.bind(this);
    this.onChangeDynamic = this.onChangeDynamic.bind(this);
    this.onChangeModel = this.onChangeModel.bind(this);
    this.onChangePartialMatch = this.onChangePartialMatch.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);

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

  onChangeModel(model) {
    return this.$scope.$evalAsync(() => {
      this.model = {
        ...this.model,
        ...model,
      };
    });
  }

  onChangePartialMatch(value) {
    return this.onChangeModel({ PartialMatch: value });
  }

  onChangeDynamic(value) {
    this.onChangeModel({ Dynamic: value });
  }

  onChangeTags(value) {
    this.onChangeModel({ TagIds: value });
  }

  associateEndpoint(endpoint) {
    if (!_.includes(this.model.Endpoints, endpoint.Id)) {
      this.model.Endpoints = [...this.model.Endpoints, endpoint.Id];
    }
  }

  dissociateEndpoint(endpoint) {
    return this.$async(async () => {
      const confirmed = await confirmDestructive({
        title: 'Confirm action',
        message: 'Removing the environment from this group will remove its corresponding edge stacks',
        confirmButton: buildConfirmButton('Confirm'),
      });

      if (!confirmed) {
        return;
      }

      this.model.Endpoints = _.filter(this.model.Endpoints, (id) => id !== endpoint.Id);
    });
  }

  getDynamicEndpoints() {
    return this.$async(this.getDynamicEndpointsAsync);
  }

  async getDynamicEndpointsAsync() {
    const { pageNumber, limit, search } = this.endpoints.state;
    const start = (pageNumber - 1) * limit + 1;
    const query = { search, types: EdgeTypes, tagIds: this.model.TagIds, tagsPartialMatch: this.model.PartialMatch };

    const response = await getEnvironments({ start, limit, query });

    const totalCount = parseInt(response.totalCount, 10);
    this.endpoints.value = response.value;
    this.endpoints.state.totalCount = totalCount;
  }

  getTags() {
    return this.$async(async () => {
      try {
        this.tags = await getTags();
      } catch (err) {
        notifyError('Failure', err, 'Unable to retrieve tags');
      }
    });
  }

  handleSubmit() {
    this.formAction(this.model);
  }

  $onInit() {
    this.getTags();
  }
}

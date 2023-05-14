import _ from 'lodash-es';
import { confirmDestructive } from '@@/modals/confirm';
import { EdgeTypes } from '@/react/portainer/environments/types';
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

    this.dynamicQuery = {
      types: EdgeTypes,
      tagIds: [],
      tagsPartialMatch: false,
    };

    this.associateEndpoint = this.associateEndpoint.bind(this);
    this.dissociateEndpoint = this.dissociateEndpoint.bind(this);
    this.onChangeTags = this.onChangeTags.bind(this);
    this.onChangeDynamic = this.onChangeDynamic.bind(this);
    this.onChangeModel = this.onChangeModel.bind(this);
    this.onChangePartialMatch = this.onChangePartialMatch.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);

    $scope.$watch(
      () => this.model,
      () => {
        if (this.model.Dynamic) {
          this.dynamicQuery = {
            types: EdgeTypes,
            tagIds: this.model.TagIds,
            tagsPartialMatch: this.model.PartialMatch,
          };
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

  associateEndpoint(endpointId) {
    if (!_.includes(this.model.Endpoints, endpointId)) {
      this.onChangeModel({ Endpoints: [...this.model.Endpoints, endpointId] });
    }
  }

  dissociateEndpoint(endpointId) {
    return this.$async(async () => {
      const confirmed = await confirmDestructive({
        title: 'Confirm action',
        message: 'Removing the environment from this group will remove its corresponding edge stacks',
        confirmButton: buildConfirmButton('Confirm'),
      });

      if (!confirmed) {
        return;
      }

      this.onChangeModel({ Endpoints: this.model.Endpoints.filter((id) => id !== endpointId) });
    });
  }

  handleSubmit() {
    this.formAction(this.model);
  }
}

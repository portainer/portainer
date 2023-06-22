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

    this.onChangeEnvironments = this.onChangeEnvironments.bind(this);
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

  onChangeEnvironments(value, meta) {
    return this.$async(async () => {
      if (meta.type === 'remove' && this.pageType === 'edit') {
        const confirmed = await confirmDestructive({
          title: 'Confirm action',
          message: 'Removing the environment from this group will remove its corresponding edge stacks',
          confirmButton: buildConfirmButton('Confirm'),
        });

        if (!confirmed) {
          return;
        }
      }

      this.onChangeModel({ Endpoints: value });
    });
  }

  handleSubmit() {
    this.formAction(this.model);
  }
}

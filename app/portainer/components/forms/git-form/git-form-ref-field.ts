import { IComponentOptions, IFormController } from 'angular';

import { GitFormModel } from '@/react/portainer/gitops/types';
import { AsyncService } from '@/portainer/services/types';
import { refFieldValidation } from '@/react/portainer/gitops/RefField/RefField';

import { validateForm } from '@@/form-components/validate-form';

class GitFormRefFieldController {
  $async: AsyncService;

  value?: string;

  onChange?: (value: string) => void;

  gitFormRefField?: IFormController;

  error?: string = '';

  model?: GitFormModel;

  stackId?: number = 0;

  /* @ngInject */
  constructor($async: AsyncService) {
    this.$async = $async;

    this.handleChange = this.handleChange.bind(this);
    this.runValidation = this.runValidation.bind(this);
  }

  async handleChange(value: string) {
    return this.$async(async () => {
      this.onChange?.(value);
      await this.runValidation(value);
    });
  }

  async runValidation(value: string) {
    return this.$async(async () => {
      this.error = '';
      this.gitFormRefField?.$setValidity(
        'gitFormRefField',
        true,
        this.gitFormRefField
      );

      this.error = await validateForm<string>(
        () => refFieldValidation(),
        value
      );
      if (this.error) {
        this.gitFormRefField?.$setValidity(
          'gitFormRefField',
          false,
          this.gitFormRefField
        );
      }
    });
  }
}

export const gitFormRefField: IComponentOptions = {
  controller: GitFormRefFieldController,
  template: `
<ng-form name="$ctrl.gitFormRefField">
  <react-git-form-ref-field
    is-url-valid="$ctrl.isUrlValid"
    model="$ctrl.model"
    value="$ctrl.value"
    on-change="$ctrl.handleChange"
    stack-id="$ctrl.stackId"
    error="$ctrl.error">
  </react-git-form-ref-field>
</ng-form>`,
  bindings: {
    isUrlValid: '<',
    value: '<',
    onChange: '<',
    model: '<',
    stackId: '<',
  },
};

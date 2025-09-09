import { IComponentOptions, IFormController } from 'angular';

import { GitFormModel } from '@/react/portainer/gitops/types';
import { AsyncService } from '@/portainer/services/types';

import { urlFieldValidation } from '@/react/portainer/gitops/GitFormUrlField';
import { ValidationError } from 'yup';

class GitFormUrlFieldController {
  $async: AsyncService;

  value?: string;

  onChange?: (value: string) => void;

  onChangeRepositoryValid?: (isValid: boolean) => void;

  gitFormUrlField?: IFormController;

  model?: GitFormModel;

  createdFromCustomTemplateId?: number;

  errors?: string = '';

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
      this.errors = '';
      this.gitFormUrlField?.$setValidity(
        'gitFormUrlField',
        true,
        this.gitFormUrlField
      );

      try {
        await urlFieldValidation().validate(value)
      } catch (error) {
        if (error instanceof ValidationError) {
          this.errors = error.message;
        } else {
          throw error;
        }
      }

      if (this.onChangeRepositoryValid) {
        this.onChangeRepositoryValid(!this.errors);
      }

      if (this.errors) {
        this.gitFormUrlField?.$setValidity(
          'gitFormUrlField',
          false,
          this.gitFormUrlField
        );
      }
    });
  }
}

export const gitFormUrlField: IComponentOptions = {
  controller: GitFormUrlFieldController,
  template: `
<ng-form name="$ctrl.gitFormUrlField">
  <react-git-form-url-field
    value="$ctrl.value"
    on-change="($ctrl.handleChange)"
    on-change-repository-valid="($ctrl.onChangeRepositoryValid)"
    model="$ctrl.model"
    created-from-custom-template-id="$ctrl.createdFromCustomTemplateId"
    errors="$ctrl.errors"  
  >
  </react-git-form-url-field>
</ng-form>`,
  bindings: {
    isUrlValid: '<',
    value: '<',
    onChange: '<',
    model: '<',
    stackId: '<',
  },
};

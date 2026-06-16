import { IFormController } from 'angular';
import { FormikErrors } from 'formik';

import { DeployMethod, GitFormModel } from '@/react/portainer/gitops/types';
import { validateGitForm } from '@/react/portainer/gitops/GitForm';

export default class GitFormController {
  errors?: FormikErrors<GitFormModel>;

  $async: <T>(fn: () => Promise<T>) => Promise<T>;

  gitForm?: IFormController;

  value?: GitFormModel;

  onChange?: (value: GitFormModel) => void;

  createdFromCustomTemplateId?: number;

  deployMethod?: DeployMethod;

  isSourceSelectionVisible?: boolean;

  /* @ngInject */
  constructor($async: <T>(fn: () => Promise<T>) => Promise<T>) {
    this.$async = $async;

    this.handleChange = this.handleChange.bind(this);
    this.runGitFormValidation = this.runGitFormValidation.bind(this);
  }

  async handleChange(newValues: Partial<GitFormModel>) {
    // this should never happen, but just in case
    if (!this.value) {
      throw new Error('GitFormController: value is required');
    }

    const value = {
      ...this.value,
      ...newValues,
    };
    this.onChange?.(value);

    const isCreatedFromCustomTemplate =
      !!this.createdFromCustomTemplateId &&
      this.createdFromCustomTemplateId > 0;
    await this.runGitFormValidation(value, isCreatedFromCustomTemplate);
  }

  async runGitFormValidation(
    value: GitFormModel,
    isCreatedFromCustomTemplate: boolean
  ) {
    return this.$async(async () => {
      this.errors = {};
      this.gitForm?.$setValidity('gitForm', true, this.gitForm);

      this.errors = await validateGitForm(
        value,
        isCreatedFromCustomTemplate,
        this.deployMethod,
        this.isSourceSelectionVisible
      );
      if (this.errors && Object.keys(this.errors).length > 0) {
        this.gitForm?.$setValidity('gitForm', false, this.gitForm);
      }
    });
  }

  async $onInit() {
    // this should never happen, but just in case
    if (!this.value) {
      throw new Error('GitFormController: value is required');
    }

    const isCreatedFromCustomTemplate =
      !!this.createdFromCustomTemplateId &&
      this.createdFromCustomTemplateId > 0;
    await this.runGitFormValidation(this.value, isCreatedFromCustomTemplate);
  }
}

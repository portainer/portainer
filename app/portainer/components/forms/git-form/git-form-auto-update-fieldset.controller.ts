import { IFormController } from 'angular';
import { FormikErrors } from 'formik';

import { IAuthenticationService } from '@/portainer/services/types';
import { AutoUpdateModel } from '@/react/portainer/gitops/types';
import { autoUpdateValidation } from '@/react/portainer/gitops/AutoUpdateFieldset/validation';

import { validateForm } from '@@/form-components/validate-form';

export default class GitFormAutoUpdateFieldsetController {
  errors?: FormikErrors<AutoUpdateModel> = {};

  $async: <T>(fn: () => Promise<T>) => Promise<T>;

  gitFormAutoUpdate?: IFormController;

  Authentication: IAuthenticationService;

  value?: AutoUpdateModel;

  onChange?: (value: AutoUpdateModel) => void;

  /* @ngInject */
  constructor(
    $async: <T>(fn: () => Promise<T>) => Promise<T>,
    Authentication: IAuthenticationService
  ) {
    this.$async = $async;
    this.Authentication = Authentication;

    this.handleChange = this.handleChange.bind(this);
    this.runGitValidation = this.runGitValidation.bind(this);
  }

  async handleChange(newValues: Partial<AutoUpdateModel>) {
    // this should never happen, but just in case
    if (!this.value) {
      throw new Error('GitFormController: value is required');
    }

    const value = {
      ...this.value,
      ...newValues,
    };
    this.onChange?.(value);
    await this.runGitValidation(value);
  }

  async runGitValidation(value: AutoUpdateModel) {
    return this.$async(async () => {
      this.errors = {};
      this.gitFormAutoUpdate?.$setValidity(
        'gitFormAuth',
        true,
        this.gitFormAutoUpdate
      );

      this.errors = await validateForm<AutoUpdateModel>(
        () => autoUpdateValidation(),
        value
      );
      if (this.errors && Object.keys(this.errors).length > 0) {
        this.gitFormAutoUpdate?.$setValidity(
          'gitFormAuth',
          false,
          this.gitFormAutoUpdate
        );
      }
    });
  }

  async $onInit() {
    // this should never happen, but just in case
    if (!this.value) {
      throw new Error('GitFormController: value is required');
    }

    await this.runGitValidation(this.value);
  }
}

import { IFormController } from 'angular';
import { FormikErrors } from 'formik';

import { GitFormModel } from '@/react/portainer/gitops/types';
import { validateGitForm } from '@/react/portainer/gitops/GitForm';
import { notifyError } from '@/portainer/services/notifications';
import { IAuthenticationService } from '@/portainer/services/types';
import { getGitCredentials } from '@/react/portainer/account/git-credentials/git-credentials.service';
import { GitCredential } from '@/react/portainer/account/git-credentials/types';
import { isBE } from '@/react/portainer/feature-flags/feature-flags.service';

export default class GitFormController {
  errors?: FormikErrors<GitFormModel>;

  $async: <T>(fn: () => Promise<T>) => Promise<T>;

  gitForm?: IFormController;

  gitCredentials: Array<GitCredential> = [];

  Authentication: IAuthenticationService;

  value?: GitFormModel;

  onChange?: (value: GitFormModel) => void;

  /* @ngInject */
  constructor(
    $async: <T>(fn: () => Promise<T>) => Promise<T>,
    Authentication: IAuthenticationService
  ) {
    this.$async = $async;
    this.Authentication = Authentication;

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
    await this.runGitFormValidation(value);
  }

  async runGitFormValidation(value: GitFormModel) {
    return this.$async(async () => {
      this.errors = {};
      this.gitForm?.$setValidity('gitForm', true, this.gitForm);

      this.errors = await validateGitForm(this.gitCredentials, value);
      if (this.errors && Object.keys(this.errors).length > 0) {
        this.gitForm?.$setValidity('gitForm', false, this.gitForm);
      }
    });
  }

  async $onInit() {
    if (isBE) {
      try {
        this.gitCredentials = await getGitCredentials(
          this.Authentication.getUserDetails().ID
        );
      } catch (err) {
        notifyError(
          'Failure',
          err as Error,
          'Unable to retrieve user saved git credentials'
        );
      }
    }

    // this should never happen, but just in case
    if (!this.value) {
      throw new Error('GitFormController: value is required');
    }

    await this.runGitFormValidation(this.value);
  }
}

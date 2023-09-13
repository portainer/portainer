import { IFormController } from 'angular';
import { FormikErrors } from 'formik';

import { notifyError } from '@/portainer/services/notifications';
import { IAuthenticationService } from '@/portainer/services/types';
import { GitAuthModel } from '@/react/portainer/gitops/types';
import { gitAuthValidation } from '@/react/portainer/gitops/AuthFieldset';
import { GitCredential } from '@/react/portainer/account/git-credentials/types';
import { getGitCredentials } from '@/react/portainer/account/git-credentials/git-credentials.service';
import { isBE } from '@/react/portainer/feature-flags/feature-flags.service';

import { validateForm } from '@@/form-components/validate-form';

export default class GitFormAuthFieldsetController {
  errors?: FormikErrors<GitAuthModel> = {};

  $async: <T>(fn: () => Promise<T>) => Promise<T>;

  gitFormAuthFieldset?: IFormController;

  gitCredentials: Array<GitCredential> = [];

  Authentication: IAuthenticationService;

  value?: GitAuthModel;

  isAuthEdit: boolean;

  onChange?: (value: GitAuthModel) => void;

  /* @ngInject */
  constructor(
    $async: <T>(fn: () => Promise<T>) => Promise<T>,
    Authentication: IAuthenticationService
  ) {
    this.$async = $async;
    this.Authentication = Authentication;

    this.isAuthEdit = false;
    this.handleChange = this.handleChange.bind(this);
    this.runGitValidation = this.runGitValidation.bind(this);
  }

  async handleChange(newValues: Partial<GitAuthModel>) {
    // this should never happen, but just in case
    if (!this.value) {
      throw new Error('GitFormController: value is required');
    }

    const value = {
      ...this.value,
      ...newValues,
    };
    this.onChange?.(value);
    await this.runGitValidation(value, false);
  }

  async runGitValidation(value: GitAuthModel, isAuthEdit: boolean) {
    return this.$async(async () => {
      this.errors = {};
      this.gitFormAuthFieldset?.$setValidity(
        'gitFormAuth',
        true,
        this.gitFormAuthFieldset
      );

      this.errors = await validateForm<GitAuthModel>(
        () => gitAuthValidation(this.gitCredentials, isAuthEdit),
        value
      );
      if (this.errors && Object.keys(this.errors).length > 0) {
        this.gitFormAuthFieldset?.$setValidity(
          'gitFormAuth',
          false,
          this.gitFormAuthFieldset
        );
      }
    });
  }

  async $onInit() {
    if (isBE) {
      try {
        // Only BE version support /gitcredentials
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
    await this.runGitValidation(this.value, this.isAuthEdit);
  }
}

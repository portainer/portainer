import { IFormController } from 'angular';
import { FormikErrors } from 'formik';

import {
  TLSConfig,
  tlsConfigValidation,
} from '@/react/portainer/environments/wizard/EnvironmentsCreationView/WizardDocker/APITab';

import { validateForm } from '@@/form-components/validate-form';

export default class TLSFieldsetController {
  errors?: FormikErrors<TLSConfig> = {};

  $async: <T>(fn: () => Promise<T>) => Promise<T>;

  tlsFieldset?: IFormController;

  values?: TLSConfig;

  onChange?: (value: TLSConfig) => void;

  /* @ngInject */
  constructor($async: <T>(fn: () => Promise<T>) => Promise<T>) {
    this.$async = $async;

    this.handleChange = this.handleChange.bind(this);
    this.runTLSConfigValidation = this.runTLSConfigValidation.bind(this);
  }

  async handleChange(newValues: Partial<TLSConfig>) {
    // this should never happen, but just in case
    if (!this.values) {
      throw new Error('TLSFieldsetController: values is required');
    }

    const values = {
      ...this.values,
      ...newValues,
    };
    this.onChange?.(values);
    await this.runTLSConfigValidation(values);
  }

  async runTLSConfigValidation(value: TLSConfig) {
    return this.$async(async () => {
      this.errors = {};
      this.tlsFieldset?.$setValidity('tlsFieldset', true, this.tlsFieldset);

      this.errors = await validateForm<TLSConfig>(
        () => tlsConfigValidation(),
        value
      );

      if (this.errors && Object.keys(this.errors).length > 0) {
        this.tlsFieldset?.$setValidity('tlsFieldset', false, this.tlsFieldset);
      }
    });
  }

  async $onInit() {
    // this should never happen, but just in case
    if (!this.values) {
      throw new Error('tlsFieldset: values is required');
    }
    await this.runTLSConfigValidation(this.values);
  }
}

import { IFormController, IComponentOptions, IModule } from 'angular';
import { FormikErrors } from 'formik';
import { SchemaOf } from 'yup';
import _ from 'lodash';
import { ComponentType } from 'react';

import { PropNames, r2a } from '@/react-tools/react2angular';

import { validateForm } from '@@/form-components/validate-form';
import { ArrayError } from '@@/form-components/InputList/InputList';

interface FormFieldProps<TValue> {
  onChange(values: TValue): void;
  values: TValue;
  errors?: FormikErrors<TValue> | ArrayError<TValue>;
}

type WithFormFieldProps<TProps, TValue> = TProps & FormFieldProps<TValue>;

/**
 * Utility function to use for wrapping react components with form validation
 * when used inside an angular form, it will set the form to invalid if the component values are invalid.
 *
 * this registers two angularjs components:
 * 1. the react component with r2a wrapping
 * 2. an angularjs component that handles form validation
 */
export function withFormValidation<TProps, TValue, TData = never>(
  ngModule: IModule,
  Component: ComponentType<WithFormFieldProps<TProps, TValue>>,
  componentName: string,
  propNames: PropNames<TProps>[],
  schemaBuilder: (data?: TData) => SchemaOf<TValue>
) {
  const reactComponentName = `react${_.upperFirst(componentName)}`;

  ngModule
    .component(
      reactComponentName,
      r2a(Component, ['errors', 'onChange', 'values', ...propNames])
    )
    .component(
      componentName,
      createFormValidationComponent(
        reactComponentName,
        propNames,
        schemaBuilder
      )
    );
}

export function createFormValidationComponent<TFormModel, TData = never>(
  componentName: string,
  props: Array<string>,
  schemaBuilder: (data?: TData) => SchemaOf<TFormModel>
): IComponentOptions {
  const kebabName = _.kebabCase(componentName);
  const propsWithErrors = [...props, 'errors', 'values'];

  return {
    template: `<ng-form name="$ctrl.form">
      <${kebabName} ${propsWithErrors
      .filter((p) => p !== 'onChange')
      .map((p) => `${_.kebabCase(p)}="$ctrl.${p}"`)
      .join(' ')}
        on-change="($ctrl.handleChange)"
      ></${kebabName}>
    </ng-form>`,
    controller: createFormValidatorController(schemaBuilder),
    bindings: Object.fromEntries(
      [...propsWithErrors, 'validationData', 'onChange'].map((p) => [p, '<'])
    ),
  };
}

export function createFormValidatorController<TFormModel, TData = never>(
  schemaBuilder: (data?: TData) => SchemaOf<TFormModel>
) {
  return class FormValidatorController {
    errors?: FormikErrors<TFormModel> = {};

    $async: <T>(fn: () => Promise<T>) => Promise<T>;

    form?: IFormController;

    values?: TFormModel;

    validationData?: TData;

    onChange?: (value: TFormModel) => void;

    /* @ngInject */
    constructor($async: <T>(fn: () => Promise<T>) => Promise<T>) {
      this.$async = $async;

      this.handleChange = this.handleChange.bind(this);
      this.runValidation = this.runValidation.bind(this);
    }

    async handleChange(newValues: TFormModel) {
      return this.$async(async () => {
        this.onChange?.(newValues);
        await this.runValidation(newValues);
      });
    }

    async runValidation(value: TFormModel) {
      return this.$async(async () => {
        this.form?.$setValidity('form', true, this.form);

        this.errors = await validateForm<TFormModel>(
          () => schemaBuilder(this.validationData),
          value
        );

        if (this.errors && Object.keys(this.errors).length > 0) {
          this.form?.$setValidity('form', false, this.form);
        }
      });
    }

    async $onInit() {
      // this should never happen, but just in case
      if (!this.values) {
        throw new Error(
          'FormValidatorController: values parameter is required'
        );
      }

      await this.runValidation(this.values);
    }
  };
}

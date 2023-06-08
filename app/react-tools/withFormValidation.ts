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
 * This utility function is used for wrapping React components with form validation.
 * When used inside an Angular form, it sets the form to invalid if the component values are invalid.
 * This function registers two AngularJS components:
 * 1. The React component with r2a wrapping:
 *   - `onChange` and `values` must be manually passed to the React component from an Angular view.
 *   - `errors` will be automatically passed to the React component and updated by the validation component.
 * 2. An AngularJS component that handles form validation, based on a yup validation schema:
 *   - `validationData` can optionally be passed to the React component from an Angular view, which can be used in validation.
 *
 * @example
 * // Usage in Angular view
 * <component
 *   values="ctrl.values"
 *   on-change="ctrl.handleChange"
 *   validation-data="ctrl.validationData">
 * </component>
 */
export function withFormValidation<TProps, TValue, TData = never>(
  ngModule: IModule,
  Component: ComponentType<WithFormFieldProps<TProps, TValue>>,
  componentName: string,
  propNames: PropNames<TProps>[],
  schemaBuilder: (validationData?: TData) => SchemaOf<TValue>
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
  propNames: Array<string>,
  schemaBuilder: (validationData?: TData) => SchemaOf<TFormModel>
): IComponentOptions {
  const kebabName = _.kebabCase(componentName);
  const propsWithErrors = [...propNames, 'errors', 'values'];

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

function createFormValidatorController<TFormModel, TData = never>(
  schemaBuilder: (validationData?: TData) => SchemaOf<TFormModel>
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

    async $onChanges(changes: { values?: { currentValue: TFormModel } }) {
      if (changes.values) {
        await this.runValidation(changes.values.currentValue);
      }
    }
  };
}

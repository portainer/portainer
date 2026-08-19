import { object, string, number } from 'yup';
import { useEffect, useState } from 'react';

import { STACK_NAME_VALIDATION_REGEX } from '@/react/constants';

import { validateForm } from '@@/form-components/validate-form';

import { FormSubmitValues } from './StackDuplicationForm.types';

/**
 * since this form has two actions, we need to manage separate validation state. Ideally we would use separate forms
 */
export function useValidation({
  values,
  currentStackName,
  currentEnvironmentId,
}: {
  values: FormSubmitValues;
  currentStackName: string;
  currentEnvironmentId: number;
}) {
  const [validState, setValidState] = useState({
    migrate: false,
    duplicate: false,
  });

  useEffect(() => {
    async function validateSchemas() {
      const migrateSchema = getMigrateValidationSchema(
        currentStackName,
        currentEnvironmentId
      );

      const migrateErrors = await validateForm(() => migrateSchema, {
        environmentId: values.environmentId || undefined,
        name: values.newName,
      });

      setValidState((state) => ({ ...state, migrate: !migrateErrors }));
    }

    validateSchemas();
  }, [
    values.environmentId,
    values.newName,
    currentStackName,
    currentEnvironmentId,
  ]);

  useEffect(() => {
    async function validateSchema() {
      const duplicateSchema = getDuplicateValidationSchema();
      const duplicateErrors = await validateForm(() => duplicateSchema, {
        environmentId: values.environmentId || undefined,
        name: values.newName,
      });

      setValidState((state) => ({ ...state, duplicate: !duplicateErrors }));
    }
    validateSchema();
  }, [values.environmentId, values.newName]);

  return validState;
}

const regexp = new RegExp(STACK_NAME_VALIDATION_REGEX);

const baseNameValidation = string().test(
  'valid-format-if-provided',
  "Stack name must consist of lower case alphanumeric characters, '_' or '-'",
  (value) => !value || regexp.test(value)
);

const baseEnvValidation = number().required(
  'Target environment must be selected'
);

export function getBaseValidationSchema() {
  return object({
    name: baseNameValidation,
    environmentId: baseEnvValidation,
  });
}

export function getDuplicateValidationSchema() {
  return object({
    name: baseNameValidation.required('Stack name is required'),
    environmentId: baseEnvValidation,
  });
}

export function getMigrateValidationSchema(
  currentStackName?: string,
  currentEnvironmentId?: number
) {
  return object({
    name: baseNameValidation
      .test(
        'required-for-rename',
        'Stack name is required when renaming',
        function validate(value) {
          const { environmentId } = this.parent;
          // If renaming (same environment), name is required
          if (
            currentEnvironmentId !== undefined &&
            environmentId === currentEnvironmentId
          ) {
            return !!value && value.length > 0;
          }
          // For migration to different environment, name is optional
          return true;
        }
      )
      .test(
        'not-same-name-for-rename',
        "Can't rename to the same name",
        function validate(value) {
          const { environmentId } = this.parent;
          // If renaming (same environment) and name matches current stack name, reject
          if (
            currentStackName &&
            currentEnvironmentId !== undefined &&
            environmentId === currentEnvironmentId &&
            value === currentStackName
          ) {
            return false;
          }
          return true;
        }
      ),
    environmentId: baseEnvValidation,
  });
}

import { SetStateAction, useEffect, useState } from 'react';
import { FormikErrors } from 'formik';

import { getVariablesFieldDefaultValues } from '@/react/portainer/custom-templates/components/CustomTemplatesVariablesField';

import { getDefaultValues as getAppVariablesDefaultValues } from '../../../../portainer/templates/app-templates/DeployFormWidget/EnvVarsFieldset';

import { TemplateSelector } from './TemplateSelector';
import { SelectedTemplateValue, Values } from './types';
import { CustomTemplateFieldset } from './CustomTemplateFieldset';
import { AppTemplateFieldset } from './AppTemplateFieldset';

export function TemplateFieldset({
  values: initialValues,
  setValues: setInitialValues,
  errors,
}: {
  errors?: FormikErrors<Values>;
  values: Values;
  setValues: (values: SetStateAction<Values>) => void;
}) {
  const [values, setControlledValues] = useState(initialValues); // todo remove when all view is in react

  useEffect(() => {
    if (
      initialValues.type !== values.type ||
      initialValues.template?.Id !== values.template?.Id
    ) {
      setControlledValues(initialValues);
    }
  }, [initialValues, values]);

  return (
    <>
      <TemplateSelector
        error={
          typeof errors?.template === 'string' ? errors?.template : undefined
        }
        value={values}
        onChange={handleChangeTemplate}
      />
      {values.template && (
        <>
          {values.type === 'custom' && (
            <CustomTemplateFieldset
              template={values.template}
              values={values.variables}
              onChange={(variables) =>
                setValues((values) => ({ ...values, variables }))
              }
              errors={errors?.variables}
            />
          )}

          {values.type === 'app' && (
            <AppTemplateFieldset
              template={values.template}
              values={values.envVars}
              onChange={(envVars) =>
                setValues((values) => ({ ...values, envVars }))
              }
              errors={errors?.envVars}
            />
          )}
        </>
      )}
    </>
  );

  function setValues(values: SetStateAction<Values>) {
    setControlledValues(values);
    setInitialValues(values);
  }

  function handleChangeTemplate(value?: SelectedTemplateValue) {
    setValues(() => {
      if (!value || !value.type || !value.template) {
        return {
          type: undefined,
          template: undefined,
          variables: [],
          envVars: {},
        };
      }

      if (value.type === 'app') {
        return {
          template: value.template,
          type: value.type,
          variables: [],
          envVars: getAppVariablesDefaultValues(value.template.Env || []),
        };
      }

      return {
        template: value.template,
        type: value.type,
        variables: getVariablesFieldDefaultValues(
          value.template.Variables || []
        ),
        envVars: {},
      };
    });
  }
}

export function getInitialTemplateValues(): Values {
  return {
    template: undefined,
    type: undefined,
    variables: [],
    file: '',
    envVars: {},
  };
}

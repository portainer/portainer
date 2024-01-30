import { SetStateAction, useEffect, useState } from 'react';
import sanitize from 'sanitize-html';
import { FormikErrors } from 'formik';

import { useCustomTemplates } from '@/react/portainer/templates/custom-templates/queries/useCustomTemplates';
import { CustomTemplate } from '@/react/portainer/templates/custom-templates/types';
import {
  CustomTemplatesVariablesField,
  VariablesFieldValue,
  getVariablesFieldDefaultValues,
} from '@/react/portainer/custom-templates/components/CustomTemplatesVariablesField';
import { useAppTemplates } from '@/react/portainer/templates/app-templates/queries/useAppTemplates';
import { TemplateViewModel } from '@/react/portainer/templates/app-templates/view-model';
import { TemplateType } from '@/react/portainer/templates/app-templates/types';

import { FormControl } from '@@/form-components/FormControl';
import { Select as ReactSelect } from '@@/form-components/ReactSelect';

type SelectedTemplateValue =
  | { template: CustomTemplate; type: 'custom' }
  | { template: TemplateViewModel; type: 'app' }
  | { template: undefined; type: undefined };

export type Values = {
  variables: VariablesFieldValue;
} & SelectedTemplateValue;

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
        onChange={(value) => {
          setValues(() => {
            if (!value || !value.type || !value.template) {
              return {
                type: undefined,
                template: undefined,
                variables: [],
              };
            }

            if (value.type === 'app') {
              return {
                template: value.template,
                type: value.type,
                variables: [],
              };
            }

            return {
              template: value.template,
              type: value.type,
              variables: getVariablesFieldDefaultValues(
                value.template.Variables || []
              ),
            };
          });
        }}
      />
      {values.template && values.type === 'custom' && (
        <>
          {values.template.Note && (
            <div>
              <div className="col-sm-12 form-section-title"> Information </div>
              <div className="form-group">
                <div className="col-sm-12">
                  <div
                    className="template-note"
                    // eslint-disable-next-line react/no-danger
                    dangerouslySetInnerHTML={{
                      __html: sanitize(values.template.Note),
                    }}
                  />
                </div>
              </div>
            </div>
          )}

          <CustomTemplatesVariablesField
            onChange={(value) => {
              setValues((values) => ({
                ...values,
                variables: value,
              }));
            }}
            value={values.variables}
            definitions={values.template.Variables}
            errors={errors?.variables}
          />
        </>
      )}
    </>
  );

  function setValues(values: SetStateAction<Values>) {
    setControlledValues(values);
    setInitialValues(values);
  }
}

function TemplateSelector({
  value,
  onChange,
  error,
}: {
  value: SelectedTemplateValue | undefined;
  onChange: (value: SelectedTemplateValue | undefined) => void;
  error?: string;
}) {
  const customTemplatesQuery = useCustomTemplates({
    params: {
      edge: true,
    },
  });

  const appTemplatesQuery = useAppTemplates({
    select: (templates) =>
      templates.filter(
        (template) =>
          template.Categories.includes('edge') &&
          template.Type !== TemplateType.Container
      ),
  });

  if (!customTemplatesQuery.data || !appTemplatesQuery.data) {
    return null;
  }

  const options = [
    {
      label: 'App templates',
      options: appTemplatesQuery.data.map((template) => ({
        label: `${template.Title} - ${template.Description}`,
        value: {
          id: template.Id,
          type: 'app' as 'app' | 'custom',
        },
      })),
    },
    {
      label: 'Custom templates',
      options: customTemplatesQuery.data.map((template) => ({
        label: `${template.Title} - ${template.Description}`,
        value: {
          id: template.Id,
          type: 'custom' as 'app' | 'custom',
        },
      })),
    },
  ] as const;

  return (
    <FormControl label="Template" inputId="stack_template" errors={error}>
      <ReactSelect
        placeholder="Select an Edge stack template"
        value={{
          label: value?.template?.Title,
          value: {
            id: value?.template?.Id,
            type: value?.type,
          },
        }}
        onChange={(value) => {
          if (!value) {
            onChange(undefined);
            return;
          }

          const { id, type } = value.value;
          if (type === 'app') {
            const template = appTemplatesQuery.data?.find(
              (template) => template.Id === id
            );

            if (!template) {
              throw new Error(`App template not found: ${id}`);
            }

            onChange({
              template,
              type: 'app',
            });
            return;
          }

          if (type === 'custom') {
            const template = customTemplatesQuery.data?.find(
              (template) => template.Id === id
            );

            if (!template) {
              throw new Error(`Custom template not found: ${id}`);
            }

            onChange({
              template,
              type: 'custom',
            });
          }
        }}
        options={options}
      />
    </FormControl>
  );
}

export function getInitialTemplateValues() {
  return {
    template: null,
    type: undefined,
    variables: [],
    file: '',
  };
}

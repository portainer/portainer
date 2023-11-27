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

import { FormControl } from '@@/form-components/FormControl';
import { PortainerSelect } from '@@/form-components/PortainerSelect';

export interface Values {
  template: CustomTemplate | undefined;
  variables: VariablesFieldValue;
}

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
    if (initialValues.template?.Id !== values.template?.Id) {
      setControlledValues(initialValues);
    }
  }, [initialValues, values.template?.Id]);

  const templatesQuery = useCustomTemplates({
    select: (templates) =>
      templates.filter((template) => template.EdgeTemplate),
  });

  return (
    <>
      <TemplateSelector
        error={errors?.template}
        value={values.template?.Id}
        onChange={(value) => {
          setValues((values) => {
            const template = templatesQuery.data?.find(
              (template) => template.Id === value
            );
            return {
              ...values,
              template,
              variables: getVariablesFieldDefaultValues(
                template?.Variables || []
              ),
            };
          });
        }}
      />
      {values.template && (
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
  value: CustomTemplate['Id'] | undefined;
  onChange: (value: CustomTemplate['Id'] | undefined) => void;
  error?: string;
}) {
  const templatesQuery = useCustomTemplates({
    select: (templates) =>
      templates.filter((template) => template.EdgeTemplate),
  });

  if (!templatesQuery.data) {
    return null;
  }

  return (
    <FormControl label="Template" inputId="stack_template" errors={error}>
      <PortainerSelect
        placeholder="Select an Edge stack template"
        value={value}
        onChange={handleChange}
        options={templatesQuery.data.map((template) => ({
          label: `${template.Title} - ${template.Description}`,
          value: template.Id,
        }))}
      />
    </FormControl>
  );

  function handleChange(value: CustomTemplate['Id']) {
    onChange(value);
  }
}

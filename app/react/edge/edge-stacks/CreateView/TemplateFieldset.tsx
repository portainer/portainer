import { useEffect, useState } from 'react';
import sanitize from 'sanitize-html';

import { useCustomTemplates } from '@/react/portainer/templates/custom-templates/queries/useCustomTemplates';
import { CustomTemplate } from '@/react/portainer/templates/custom-templates/types';
import { useCustomTemplateFile } from '@/react/portainer/templates/custom-templates/queries/useCustomTemplateFile';
import {
  CustomTemplatesVariablesField,
  VariablesFieldValue,
  getVariablesFieldDefaultValues,
} from '@/react/portainer/custom-templates/components/CustomTemplatesVariablesField';
import { renderTemplate } from '@/react/portainer/custom-templates/components/utils';

import { WebEditorForm } from '@@/WebEditorForm';
import { FormControl } from '@@/form-components/FormControl';
import { PortainerSelect } from '@@/form-components/PortainerSelect';

export function TemplateFieldset({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  const [selectedTemplate, setSelectedTemplate] =
    useState<CustomTemplate | null>(null);
  const fileQuery = useCustomTemplateFile(
    selectedTemplate?.Id,
    !!selectedTemplate?.GitConfig
  );
  const [variableValues, setVariableValues] = useState<VariablesFieldValue>([]);

  useEffect(() => {
    if (fileQuery.data && fileQuery.data !== value && selectedTemplate) {
      onChange(
        renderTemplate(
          fileQuery.data,
          variableValues,
          selectedTemplate.Variables
        )
      );
    }
  }, [fileQuery.data, onChange, selectedTemplate, value, variableValues]);

  return (
    <>
      <TemplateSelector
        value={selectedTemplate}
        onChange={handleChangeTemplate}
      />
      {selectedTemplate && (
        <>
          {selectedTemplate.Note && (
            <div>
              <div className="col-sm-12 form-section-title"> Information </div>
              <div className="form-group">
                <div className="col-sm-12">
                  <div
                    className="template-note"
                    // eslint-disable-next-line react/no-danger
                    dangerouslySetInnerHTML={{
                      __html: sanitize(selectedTemplate.Note),
                    }}
                  />
                </div>
              </div>
            </div>
          )}

          <CustomTemplatesVariablesField
            onChange={(value) => {
              setVariableValues(value);
              onChange(
                renderTemplate(
                  fileQuery.data || '',
                  value,
                  selectedTemplate.Variables
                )
              );
            }}
            value={variableValues}
            definitions={selectedTemplate.Variables}
          />

          <WebEditorForm
            id="template-content-editor"
            value={fileQuery.isLoading ? 'Loading...' : value}
            onChange={onChange}
            yaml
            placeholder="Define or paste the content of your docker compose file here"
          />
        </>
      )}
    </>
  );

  function handleChangeTemplate(template: CustomTemplate | null) {
    setSelectedTemplate(template);
    if (template) {
      setVariableValues(getVariablesFieldDefaultValues(template.Variables));
    }
  }
}

function TemplateSelector({
  value,
  onChange,
}: {
  value: CustomTemplate | null;
  onChange: (value: CustomTemplate | null) => void;
}) {
  const templatesQuery = useCustomTemplates({
    select: (templates) =>
      templates.filter((template) => template.EdgeTemplate),
  });
  const selectedId = value?.Id;

  if (!templatesQuery.data) {
    return null;
  }

  return (
    <FormControl label="Template" inputId="stack_template">
      <PortainerSelect
        placeholder="Select an Edge stack template"
        value={selectedId}
        onChange={handleChange}
        options={templatesQuery.data.map((template) => ({
          label: `${template.Title} - ${template.Description}`,
          value: template.Id,
        }))}
      />
    </FormControl>
  );

  function handleChange(value: CustomTemplate['Id']) {
    const template =
      templatesQuery.data?.find((template) => template.Id === value) || null;
    onChange(template);
  }
}

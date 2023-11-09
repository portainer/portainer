import { useState } from 'react';
import sanitize from 'sanitize-html';

import { useCustomTemplates } from '@/react/portainer/templates/custom-templates/queries/useCustomTemplates';
import { CustomTemplate } from '@/react/portainer/templates/custom-templates/types';
import { useCustomTemplateFileMutation } from '@/react/portainer/templates/custom-templates/queries/useCustomTemplateFile';
import {
  CustomTemplatesVariablesField,
  VariablesFieldValue,
  getVariablesFieldDefaultValues,
} from '@/react/portainer/custom-templates/components/CustomTemplatesVariablesField';
import { renderTemplate } from '@/react/portainer/custom-templates/components/utils';

import { FormControl } from '@@/form-components/FormControl';
import { PortainerSelect } from '@@/form-components/PortainerSelect';

export function TemplateFieldset({
  value: selectedTemplate,
  onChange,
  onChangeFile,
}: {
  value: CustomTemplate | undefined;
  onChange: (value?: CustomTemplate) => void;
  onChangeFile: (value: string) => void;
}) {
  const fetchFileMutation = useCustomTemplateFileMutation();
  const [templateFile, setTemplateFile] = useState('');
  const templatesQuery = useCustomTemplates({
    select: (templates) =>
      templates.filter((template) => template.EdgeTemplate),
  });

  const [variableValues, setVariableValues] = useState<VariablesFieldValue>([]);

  return (
    <>
      <TemplateSelector
        value={selectedTemplate?.Id}
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
              onChangeFile(
                renderTemplate(templateFile, value, selectedTemplate.Variables)
              );
            }}
            value={variableValues}
            definitions={selectedTemplate.Variables}
          />
        </>
      )}
    </>
  );

  function handleChangeTemplate(templateId: CustomTemplate['Id'] | undefined) {
    const selectedTemplate = templatesQuery.data?.find(
      (template) => template.Id === templateId
    );
    if (!selectedTemplate) {
      setVariableValues([]);
      onChange(undefined);
      return;
    }

    fetchFileMutation.mutate(
      { id: selectedTemplate.Id, git: !!selectedTemplate.GitConfig },
      {
        onSuccess: (data) => {
          setTemplateFile(data);
          onChangeFile(
            renderTemplate(
              data,
              getVariablesFieldDefaultValues(selectedTemplate.Variables),
              selectedTemplate.Variables
            )
          );
        },
      }
    );
    setVariableValues(
      selectedTemplate
        ? getVariablesFieldDefaultValues(selectedTemplate.Variables)
        : []
    );
    onChange(selectedTemplate);
  }
}

function TemplateSelector({
  value,
  onChange,
}: {
  value: CustomTemplate['Id'] | undefined;
  onChange: (value: CustomTemplate['Id'] | undefined) => void;
}) {
  const templatesQuery = useCustomTemplates({
    select: (templates) =>
      templates.filter((template) => template.EdgeTemplate),
  });

  if (!templatesQuery.data) {
    return null;
  }

  return (
    <FormControl label="Template" inputId="stack_template">
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

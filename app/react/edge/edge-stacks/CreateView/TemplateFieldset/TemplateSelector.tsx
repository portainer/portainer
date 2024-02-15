import { useMemo } from 'react';
import { GroupBase } from 'react-select';

import { useCustomTemplates } from '@/react/portainer/templates/custom-templates/queries/useCustomTemplates';
import { useAppTemplates } from '@/react/portainer/templates/app-templates/queries/useAppTemplates';
import { TemplateType } from '@/react/portainer/templates/app-templates/types';

import { FormControl } from '@@/form-components/FormControl';
import { Select as ReactSelect } from '@@/form-components/ReactSelect';

import { SelectedTemplateValue } from './types';

export function TemplateSelector({
  value,
  onChange,
  error,
}: {
  value: SelectedTemplateValue;
  onChange: (value: SelectedTemplateValue) => void;
  error?: string;
}) {
  const { getTemplate, options } = useOptions();

  return (
    <FormControl label="Template" inputId="template_selector" errors={error}>
      <ReactSelect
        inputId="template_selector"
        formatGroupLabel={GroupLabel}
        placeholder="Select an Edge stack template"
        value={{
          label: value.template?.Title,
          id: value.template?.Id,
          type: value.type,
        }}
        onChange={(value) => {
          if (!value) {
            onChange({
              template: undefined,
              type: undefined,
            });
            return;
          }

          const { id, type } = value;
          if (!id || type === undefined) {
            return;
          }

          const template = getTemplate({ id, type });
          onChange({ template, type } as SelectedTemplateValue);
        }}
        options={options}
      />
    </FormControl>
  );
}

function useOptions() {
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

  const options = useMemo(
    () =>
      [
        {
          label: 'Edge App Templates',
          options:
            appTemplatesQuery.data?.map((template) => ({
              label: `${template.Title} - ${template.Description}`,
              id: template.Id,
              type: 'app' as 'app' | 'custom',
            })) || [],
        },
        {
          label: 'Edge Custom Templates',
          options:
            customTemplatesQuery.data && customTemplatesQuery.data.length > 0
              ? customTemplatesQuery.data.map((template) => ({
                  label: `${template.Title} - ${template.Description}`,
                  id: template.Id,
                  type: 'custom' as 'app' | 'custom',
                }))
              : [
                  {
                    label: 'No edge custom templates available',
                    id: 0,
                    type: 'custom' as 'app' | 'custom',
                  },
                ],
        },
      ] as const,
    [appTemplatesQuery.data, customTemplatesQuery.data]
  );

  return { options, getTemplate };

  function getTemplate({ type, id }: { type: 'app' | 'custom'; id: number }) {
    if (type === 'app') {
      const template = appTemplatesQuery.data?.find(
        (template) => template.Id === id
      );

      if (!template) {
        throw new Error(`App template not found: ${id}`);
      }

      return template;
    }

    const template = customTemplatesQuery.data?.find(
      (template) => template.Id === id
    );

    if (!template) {
      throw new Error(`Custom template not found: ${id}`);
    }
    return template;
  }
}

function GroupLabel({ label }: GroupBase<unknown>) {
  return (
    <span className="font-bold text-black th-dark:text-white th-highcontrast:text-white">
      {label}
    </span>
  );
}

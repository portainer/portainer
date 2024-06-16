import { useMemo } from 'react';
import { GroupBase } from 'react-select';

import { useCustomTemplates } from '@/react/portainer/templates/custom-templates/queries/useCustomTemplates';
import { useAppTemplates } from '@/react/portainer/templates/app-templates/queries/useAppTemplates';
import { TemplateType } from '@/react/portainer/templates/app-templates/types';
import { TemplateViewModel } from '@/react/portainer/templates/app-templates/view-model';
import { CustomTemplate } from '@/react/portainer/templates/custom-templates/types';

import { FormControl } from '@@/form-components/FormControl';
import { Select as ReactSelect } from '@@/form-components/ReactSelect';

import { SelectedTemplateValue } from './types';

export function TemplateSelector({
  value,
  onChange,
  error,
}: {
  value: SelectedTemplateValue;
  onChange: (
    template: TemplateViewModel | CustomTemplate | undefined,
    type: 'app' | 'custom' | undefined
  ) => void;
  error?: string;
}) {
  const { options, getTemplate, selectedValue } = useOptions(value);

  return (
    <FormControl label="Template" inputId="template_selector" errors={error}>
      <ReactSelect
        inputId="template_selector"
        formatGroupLabel={GroupLabel}
        placeholder="Select an Edge stack template"
        options={options}
        value={selectedValue}
        onChange={(value) => {
          if (!value) {
            onChange(undefined, undefined);
            return;
          }

          const { templateId, type } = value;
          if (!templateId || type === undefined) {
            return;
          }
          onChange(getTemplate({ type, id: templateId }), type);
        }}
        data-cy="edge-stacks-create-template-selector"
      />
    </FormControl>
  );
}

interface Option {
  label: string;
  templateId?: number;
  type: 'app' | 'custom';
}

function useOptions(value: SelectedTemplateValue) {
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

  const appTemplateOptions: Array<Option> = useMemo(
    () =>
      appTemplatesQuery.data?.map(
        (template) =>
          ({
            label: `${template.Title} - ${template.Description}`,

            templateId: template.Id,
            type: 'app',
          }) satisfies Option
      ) || [],
    [appTemplatesQuery.data]
  );

  const customTemplateOptions: Array<Option> = useMemo(
    () =>
      customTemplatesQuery.data && customTemplatesQuery.data.length > 0
        ? customTemplatesQuery.data.map(
            (template) =>
              ({
                label: `${template.Title} - ${template.Description}`,

                templateId: template.Id,
                type: 'custom' as 'app' | 'custom',
              }) satisfies Option
          )
        : [
            {
              label: 'No edge custom templates available',

              templateId: undefined,
              type: 'custom' as 'app' | 'custom',
            } satisfies Option,
          ],
    [customTemplatesQuery.data]
  );

  const options = useMemo(
    () =>
      [
        {
          label: 'Edge App Templates',
          options: appTemplateOptions,
        },
        {
          label: 'Edge Custom Templates',
          options: customTemplateOptions,
        },
      ] as const,
    [appTemplateOptions, customTemplateOptions]
  );

  const selectedValue: Option | undefined = useMemo(() => {
    if (!value.templateId) {
      return undefined;
    }

    if (value.type === 'app') {
      return appTemplateOptions.find(
        (template) => template.templateId === value.templateId
      );
    }

    return customTemplateOptions.find(
      (template) => template.templateId === value.templateId
    );
  }, [value.templateId, value.type, customTemplateOptions, appTemplateOptions]);

  return { options, getTemplate, selectedValue };

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

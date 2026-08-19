import { useEffect, useRef } from 'react';

import {
  getVariablesFieldDefaultValues,
  VariablesFieldValue,
} from '@/react/portainer/custom-templates/components/CustomTemplatesVariablesField';
import { CustomTemplate } from '@/react/portainer/templates/custom-templates/types';

export function useTemplateInitialization({
  selectedTemplate,
  templateFile,
  onVariablesChange,
  onFileContentChange,
}: {
  selectedTemplate: CustomTemplate | undefined;
  templateFile: string;
  onVariablesChange(values: VariablesFieldValue): void;
  onFileContentChange(value: string): void;
}) {
  const lastInitializedTemplateId = useRef<number | null>(null);

  useEffect(() => {
    if (!templateFile || !selectedTemplate) {
      return;
    }

    if (lastInitializedTemplateId.current === selectedTemplate.Id) {
      return;
    }

    lastInitializedTemplateId.current = selectedTemplate.Id;

    if (!selectedTemplate.Variables?.length) {
      onFileContentChange(templateFile);
    }

    const defaultVariables = getVariablesFieldDefaultValues(
      selectedTemplate.Variables
    );
    onVariablesChange(defaultVariables);
  }, [templateFile, selectedTemplate, onVariablesChange, onFileContentChange]);
}

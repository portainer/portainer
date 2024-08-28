import { SetStateAction, useEffect, useState } from 'react';

import { renderTemplate } from '@/react/portainer/custom-templates/components/utils';
import { useCustomTemplateFile } from '@/react/portainer/templates/custom-templates/queries/useCustomTemplateFile';
import { useCustomTemplate } from '@/react/portainer/templates/custom-templates/queries/useCustomTemplate';
import { CustomTemplate } from '@/react/portainer/templates/custom-templates/types';
import { StackType } from '@/react/common/stacks/types';
import { toGitFormModel } from '@/react/portainer/gitops/types';

import { DeploymentType } from '../types';
import { getDefaultStaggerConfig } from '../components/StaggerFieldset.types';

import { DockerFormValues, FormValues } from './types';

export function useRenderTemplate(
  templateValues: DockerFormValues['templateValues'],
  setValues: (values: SetStateAction<DockerFormValues>) => void
) {
  const templateQuery = useCustomTemplate(templateValues.templateId, {
    enabled: templateValues.type === 'custom',
  });

  const template = templateQuery.data;

  const templateFileQuery = useCustomTemplateFile(
    templateValues.templateId,
    !!template?.GitConfig,
    {
      enabled: templateValues.type === 'custom',
    }
  );
  const [renderedFile, setRenderedFile] = useState<string>('');

  useEffect(() => {
    if (templateFileQuery.data) {
      const newFile = renderTemplate(
        templateFileQuery.data,
        templateValues.variables,
        template?.Variables || []
      );

      if (newFile !== renderedFile) {
        setRenderedFile(newFile);
        setValues((values) => ({
          ...values,
          fileContent: newFile,
        }));
      }
    }
  }, [
    renderedFile,
    setValues,
    template,
    templateFileQuery.data,
    templateValues.variables,
  ]);

  const [currentTemplateId, setCurrentTemplateId] = useState<
    number | undefined
  >(templateValues.templateId);

  useEffect(() => {
    if (template?.Id !== currentTemplateId) {
      setCurrentTemplateId(template?.Id);
      setValues((values) => ({
        ...values,
        ...getValuesFromTemplate(template),
      }));
    }
  }, [currentTemplateId, setValues, template]);

  return template;
}

function getValuesFromTemplate(
  template: CustomTemplate | undefined
): Partial<FormValues> {
  if (!template) {
    return {};
  }

  return {
    deploymentType:
      template.Type === StackType.Kubernetes
        ? DeploymentType.Kubernetes
        : DeploymentType.Compose,
    git: toGitFormModel(template.GitConfig),
    ...(template.EdgeSettings
      ? {
          prePullImage: template.EdgeSettings.PrePullImage || false,
          retryDeploy: template.EdgeSettings.RetryDeploy || false,
          privateRegistryId: template.EdgeSettings.PrivateRegistryId,
          staggerConfig:
            template.EdgeSettings.StaggerConfig || getDefaultStaggerConfig(),
          ...template.EdgeSettings.RelativePathSettings,
        }
      : {}),
  };
}

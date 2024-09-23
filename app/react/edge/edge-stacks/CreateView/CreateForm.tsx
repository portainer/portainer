import { Formik } from 'formik';
import { useState } from 'react';

import { toGitFormModel } from '@/react/portainer/gitops/types';
import { getDefaultRelativePathModel } from '@/react/portainer/gitops/RelativePathFieldset/types';
import { createWebhookId } from '@/portainer/helpers/webhookHelper';
import { CustomTemplate } from '@/react/portainer/templates/custom-templates/types';
import { useCustomTemplate } from '@/react/portainer/templates/custom-templates/queries/useCustomTemplate';
import { getVariablesFieldDefaultValues } from '@/react/portainer/custom-templates/components/CustomTemplatesVariablesField';
import { useAppTemplate } from '@/react/portainer/templates/app-templates/queries/useAppTemplates';
import { TemplateViewModel } from '@/react/portainer/templates/app-templates/view-model';
import { getDefaultValues as getEnvVarDefaultValues } from '@/react/portainer/templates/app-templates/DeployFormWidget/EnvVarsFieldset';
import { parseAutoUpdateResponse } from '@/react/portainer/gitops/AutoUpdateFieldset/utils';

import { Widget } from '@@/Widget';

import { DeploymentType } from '../types';
import { getDefaultStaggerConfig } from '../components/StaggerFieldset.types';

import { InnerForm } from './InnerForm';
import { FormValues } from './types';
import { useValidation } from './CreateForm.validation';
import { Values as TemplateValues } from './TemplateFieldset/types';
import { getInitialTemplateValues } from './TemplateFieldset/TemplateFieldset';
import { useTemplateParams } from './useTemplateParams';
import { useCreate } from './useCreate';

export function CreateForm() {
  const [webhookId] = useState(() => createWebhookId());

  const [templateParams, setTemplateParams] = useTemplateParams();
  const templateQuery = useTemplate(templateParams.type, templateParams.id);

  const validation = useValidation(templateQuery);
  const mutation = useCreate({
    webhookId,
    template: templateQuery.customTemplate || templateQuery.appTemplate,
    templateType: templateParams.type,
  });

  if (
    templateParams.id &&
    !(templateQuery.customTemplate || templateQuery.appTemplate)
  ) {
    return null;
  }

  const template = templateQuery.customTemplate || templateQuery.appTemplate;

  const initialValues: FormValues = {
    name: '',
    groupIds: [],
    deploymentType: DeploymentType.Compose,
    envVars: [],
    privateRegistryId: 0,
    prePullImage: false,
    retryDeploy: false,
    staggerConfig: getDefaultStaggerConfig(),
    method: templateParams.id ? 'template' : 'editor',
    git: toGitFormModel(undefined, parseAutoUpdateResponse()),
    relativePath: getDefaultRelativePathModel(),
    enableWebhook: false,
    fileContent: '',
    templateValues: getTemplateValues(templateParams.type, template),
    useManifestNamespaces: false,
  };

  return (
    <div className="row">
      <div className="col-sm-12">
        <Widget>
          <Widget.Body>
            <Formik
              initialValues={initialValues}
              onSubmit={mutation.onSubmit}
              validationSchema={validation}
            >
              <InnerForm
                webhookId={webhookId}
                isLoading={mutation.isLoading}
                onChangeTemplate={setTemplateParams}
              />
            </Formik>
          </Widget.Body>
        </Widget>
      </div>
    </div>
  );
}

function getTemplateValues(
  type: 'custom' | 'app' | undefined,
  template: TemplateViewModel | CustomTemplate | undefined
): TemplateValues {
  if (!type || !template) {
    return getInitialTemplateValues();
  }

  if (type === 'custom') {
    const customTemplate = template as CustomTemplate;
    return {
      templateId: customTemplate.Id,
      type,
      variables: getVariablesFieldDefaultValues(customTemplate.Variables),
      envVars: {},
    };
  }

  const appTemplate = template as TemplateViewModel;

  return {
    templateId: appTemplate.Id,
    type,
    variables: [],
    envVars: getEnvVarDefaultValues(appTemplate.Env),
  };
}

function useTemplate(
  type: 'app' | 'custom' | undefined,
  id: number | undefined
) {
  const customTemplateQuery = useCustomTemplate(id, {
    enabled: type === 'custom',
  });
  const appTemplateQuery = useAppTemplate(id, {
    enabled: type === 'app',
  });

  return {
    appTemplate: appTemplateQuery.data,
    customTemplate: customTemplateQuery.data,
  };
}

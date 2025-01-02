import { Formik } from 'formik';
import { useState, useMemo } from 'react';

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
import { useValidation } from './CreateForm.validation';
import { Values as TemplateValues } from './TemplateFieldset/types';
import { getInitialTemplateValues } from './TemplateFieldset/TemplateFieldset';
import { useTemplateParams } from './useTemplateParams';
import { useCreate } from './useCreate';
import { FormValues } from './types';

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

  const initialValues = useInitialValues(templateQuery, templateParams);

  if (!initialValues) {
    return null;
  }

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
    appTemplate: type === 'app' ? appTemplateQuery.data : undefined,
    customTemplate: type === 'custom' ? customTemplateQuery.data : undefined,
  };
}

function useInitialValues(
  templateQuery: {
    appTemplate: TemplateViewModel | undefined;
    customTemplate: CustomTemplate | undefined;
  },
  templateParams: {
    id: number | undefined;
    type: 'app' | 'custom' | undefined;
  }
) {
  const template = templateQuery.customTemplate || templateQuery.appTemplate;
  const initialValues: FormValues = useMemo(
    () => ({
      name: '',
      groupIds: [],
      // if edge custom templates allow kube manifests/helm charts in future, add logic for setting this for the initial deploymentType
      deploymentType: DeploymentType.Compose,
      envVars: [],
      privateRegistryId:
        templateQuery.customTemplate?.EdgeSettings?.PrivateRegistryId ?? 0,
      prePullImage:
        templateQuery.customTemplate?.EdgeSettings?.PrePullImage ?? false,
      retryDeploy:
        templateQuery.customTemplate?.EdgeSettings?.RetryDeploy ?? false,
      staggerConfig:
        templateQuery.customTemplate?.EdgeSettings?.StaggerConfig ??
        getDefaultStaggerConfig(),
      method: templateParams.id ? 'template' : 'editor',
      git: toGitFormModel(
        templateQuery.customTemplate?.GitConfig,
        parseAutoUpdateResponse()
      ),
      relativePath:
        templateQuery.customTemplate?.EdgeSettings?.RelativePathSettings ??
        getDefaultRelativePathModel(),
      enableWebhook: false,
      fileContent: '',
      templateValues: getTemplateValues(templateParams.type, template),
      useManifestNamespaces: false,
    }),
    [
      templateQuery.customTemplate,
      templateParams.id,
      templateParams.type,
      template,
    ]
  );

  if (
    templateParams.id &&
    !templateQuery.customTemplate &&
    !templateQuery.appTemplate
  ) {
    return null;
  }

  return initialValues;
}

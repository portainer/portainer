import { Formik } from 'formik';
import { useRouter } from '@uirouter/react';

import { notifySuccess } from '@/portainer/services/notifications';
import { EnvironmentId } from '@/react/portainer/environments/types';
import { useEnvironmentDeploymentOptions } from '@/react/portainer/environments/queries/useEnvironment';
import { useCurrentEnvironment } from '@/react/hooks/useCurrentEnvironment';
import { isKubernetesEnvironment } from '@/react/portainer/environments/utils';
import { DeployMethod } from '@/react/portainer/gitops/types';
import { StackType } from '@/react/common/stacks/types';

import { CustomTemplate } from '../types';
import { useUpdateTemplateMutation } from '../queries/useUpdateTemplateMutation';
import { useCustomTemplateFile } from '../queries/useCustomTemplateFile';
import { TemplateViewType } from '../useViewType';

import { useInitialValues } from './useInitialValues';
import { FormValues } from './types';
import { useValidation } from './useValidation';
import { InnerForm } from './InnerForm';

export function EditForm({
  template,
  environmentId,
  viewType,
}: {
  template: CustomTemplate;
  environmentId?: EnvironmentId;
  viewType: TemplateViewType;
}) {
  const isEdge = template.EdgeTemplate;
  const isGit = !!template.GitConfig;

  const router = useRouter();
  const disableEditor = useDisableEditor(isGit);
  const mutation = useUpdateTemplateMutation();
  const deployMethod: DeployMethod =
    template.Type === StackType.Kubernetes ? 'manifest' : 'compose';
  const validation = useValidation({
    viewType,
    isGit,
    templateId: template.Id,
    deployMethod,
  });

  const fileContentQuery = useCustomTemplateFile(template.Id);

  const initialValues = useInitialValues({
    isEdge,
    template,
    templateFile: fileContentQuery.data,
  });

  if (fileContentQuery.isLoading || !initialValues) {
    return null;
  }

  return (
    <Formik
      initialValues={initialValues}
      onSubmit={handleSubmit}
      validationSchema={validation}
      validateOnMount
    >
      <InnerForm
        isLoading={mutation.isLoading}
        environmentId={environmentId}
        isEditorReadonly={disableEditor}
        refreshGitFile={fileContentQuery.refetch}
        gitFileContent={fileContentQuery.data}
        gitFileError={
          fileContentQuery.error instanceof Error
            ? fileContentQuery.error.message
            : ''
        }
      />
    </Formik>
  );

  function handleSubmit(values: FormValues) {
    mutation.mutate(
      {
        id: template.Id,
        EdgeTemplate: template.EdgeTemplate,
        Description: values.Description,
        Title: values.Title,
        Type: values.Type,
        Logo: values.Logo,
        FileContent: values.FileContent,
        Note: values.Note,
        Platform: values.Platform,
        Variables: values.Variables,
        EdgeSettings: values.EdgeSettings,
        AccessControl: values.AccessControl,
        resourceControlId: template.ResourceControl?.Id,
        ...values.Git,
      },
      {
        onSuccess() {
          notifySuccess('Success', 'Template updated successfully');
          router.stateService.go('^');
        },
      }
    );
  }
}

function useDisableEditor(isGit: boolean) {
  const environment = useCurrentEnvironment(false);

  const deploymentOptionsQuery = useEnvironmentDeploymentOptions(
    environment.data && isKubernetesEnvironment(environment.data.Type)
      ? environment.data.Id
      : undefined
  );

  return isGit || !!deploymentOptionsQuery.data?.hideAddWithForm;
}

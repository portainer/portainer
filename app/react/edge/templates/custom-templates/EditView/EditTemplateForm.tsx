import { Formik } from 'formik';
import { useRouter } from '@uirouter/react';

import { notifySuccess } from '@/portainer/services/notifications';
import { CustomTemplate } from '@/react/portainer/templates/custom-templates/types';
import { useCustomTemplateFile } from '@/react/portainer/templates/custom-templates/queries/useCustomTemplateFile';
import { useUpdateTemplateMutation } from '@/react/portainer/templates/custom-templates/queries/useUpdateTemplateMutation';
import {
  getTemplateVariables,
  intersectVariables,
  isTemplateVariablesEnabled,
} from '@/react/portainer/custom-templates/components/utils';
import { toGitFormModel } from '@/react/portainer/gitops/types';
import { useSaveCredentialsIfRequired } from '@/react/portainer/account/git-credentials/queries/useCreateGitCredentialsMutation';

import { toGitRequest } from '../common/git';

import { InnerForm } from './InnerForm';
import { FormValues } from './types';
import { useValidation } from './useValidation';

export function EditTemplateForm({ template }: { template: CustomTemplate }) {
  const mutation = useUpdateTemplateMutation();
  const router = useRouter();
  const isGit = !!template.GitConfig;
  const validation = useValidation(template.Id, isGit);
  const fileQuery = useCustomTemplateFile(template.Id, isGit);
  const { saveCredentials, isLoading: isSaveCredentialsLoading } =
    useSaveCredentialsIfRequired();

  if (fileQuery.isLoading) {
    return null;
  }

  const initialValues: FormValues = {
    Title: template.Title,
    Type: template.Type,
    Description: template.Description,
    Note: template.Note,
    Logo: template.Logo,
    Platform: template.Platform,
    Variables: parseTemplate(fileQuery.data || ''),

    FileContent: fileQuery.data || '',
    Git: template.GitConfig ? toGitFormModel(template.GitConfig) : undefined,
    EdgeSettings: template.EdgeSettings,
  };

  return (
    <Formik
      initialValues={initialValues}
      onSubmit={handleSubmit}
      validationSchema={validation}
      validateOnMount
    >
      <InnerForm
        isLoading={mutation.isLoading || isSaveCredentialsLoading}
        isEditorReadonly={isGit}
        gitFileContent={isGit ? fileQuery.data : ''}
        refreshGitFile={fileQuery.refetch}
        gitFileError={
          fileQuery.error instanceof Error ? fileQuery.error.message : ''
        }
      />
    </Formik>
  );

  async function handleSubmit(values: FormValues) {
    const credentialId = await saveCredentials(values.Git);

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
        ...(values.Git ? toGitRequest(values.Git, credentialId) : {}),
      },
      {
        onSuccess() {
          notifySuccess('Success', 'Template updated successfully');
          router.stateService.go('^');
        },
      }
    );
  }

  function parseTemplate(templateContent: string) {
    if (!isTemplateVariablesEnabled) {
      return template.Variables;
    }

    const [variables] = getTemplateVariables(templateContent);

    if (!variables) {
      return template.Variables;
    }

    return intersectVariables(template.Variables, variables);
  }
}

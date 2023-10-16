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

import { InnerForm } from './InnerForm';
import { FormValues } from './types';
import { useValidation } from './useValidation';

export function EditTemplateForm({ template }: { template: CustomTemplate }) {
  const mutation = useUpdateTemplateMutation();
  const router = useRouter();
  const isGit = !!template.GitConfig;
  const validation = useValidation(template.Id, isGit);
  const fileQuery = useCustomTemplateFile(template.Id, isGit);

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
    Git: template.GitConfig
      ? {
          RepositoryURL: template.GitConfig.URL,
          RepositoryReferenceName: template.GitConfig.ReferenceName,
          RepositoryAuthentication: !!template.GitConfig.Authentication,
          RepositoryUsername: template.GitConfig.Authentication
            ? template.GitConfig.Authentication.Username
            : '',
          RepositoryPassword: template.GitConfig.Authentication
            ? template.GitConfig.Authentication.Password
            : '',
          RepositoryGitCredentialID: template.GitConfig.Authentication
            ? template.GitConfig.Authentication.GitCredentialID
            : 0,
          ComposeFilePathInRepository: template.GitConfig.ConfigFilePath,
          TLSSkipVerify: template.GitConfig.TLSSkipVerify,
        }
      : undefined,
  };

  return (
    <Formik
      initialValues={initialValues}
      onSubmit={handleSubmit}
      validationSchema={validation}
      validateOnMount
    >
      <InnerForm
        isLoading={mutation.isLoading}
        isEditorReadonly={isGit}
        gitFileContent={isGit ? fileQuery.data : ''}
        refreshGitFile={fileQuery.refetch}
        gitFileError={
          fileQuery.error instanceof Error ? fileQuery.error.message : ''
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
        ComposeFilePathInRepository: values.Git?.ComposeFilePathInRepository,
        Logo: values.Logo,
        FileContent: values.FileContent,
        Note: values.Note,
        Platform: values.Platform,
        RepositoryAuthentication: values.Git?.RepositoryAuthentication,
        RepositoryGitCredentialID: values.Git?.RepositoryGitCredentialID,
        RepositoryPassword: values.Git?.RepositoryPassword,
        RepositoryReferenceName: values.Git?.RepositoryReferenceName,
        RepositoryURL: values.Git?.RepositoryURL,
        RepositoryUsername: values.Git?.RepositoryUsername,
        TLSSkipVerify: values.Git?.TLSSkipVerify,
        Variables: values.Variables,
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

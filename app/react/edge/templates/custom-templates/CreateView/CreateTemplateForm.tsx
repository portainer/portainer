import { Formik } from 'formik';
import { useCurrentStateAndParams, useRouter } from '@uirouter/react';

import { StackType } from '@/react/common/stacks/types';
import { notifySuccess } from '@/portainer/services/notifications';
import { useCreateTemplateMutation } from '@/react/portainer/templates/custom-templates/queries/useCreateTemplateMutation';
import { Platform } from '@/react/portainer/templates/types';
import { useFetchTemplateFile } from '@/react/portainer/templates/app-templates/queries/useFetchTemplateFile';
import { getDefaultEdgeTemplateSettings } from '@/react/portainer/templates/custom-templates/types';
import { useSaveCredentialsIfRequired } from '@/react/portainer/account/git-credentials/queries/useCreateGitCredentialsMutation';

import { editor } from '@@/BoxSelector/common-options/build-methods';

import { toGitRequest } from '../common/git';

import { InnerForm } from './InnerForm';
import { FormValues } from './types';
import { useValidation } from './useValidation';

export function CreateTemplateForm() {
  const router = useRouter();
  const mutation = useCreateTemplateMutation();
  const validation = useValidation();
  const { appTemplateId, type } = useParams();
  const { saveCredentials, isLoading: isSaveCredentialsLoading } =
    useSaveCredentialsIfRequired();

  const fileContentQuery = useFetchTemplateFile(appTemplateId);

  if (fileContentQuery.isLoading) {
    return null;
  }

  const initialValues: FormValues = {
    Title: '',
    FileContent: fileContentQuery.data ?? '',
    Type: type,
    File: undefined,
    Method: editor.value,
    Description: '',
    Note: '',
    Logo: '',
    Platform: Platform.LINUX,
    Variables: [],
    Git: {
      RepositoryURL: '',
      RepositoryReferenceName: '',
      RepositoryAuthentication: false,
      RepositoryUsername: '',
      RepositoryPassword: '',
      ComposeFilePathInRepository: 'docker-compose.yml',
      AdditionalFiles: [],
      RepositoryURLValid: true,
      TLSSkipVerify: false,
    },
    EdgeSettings: getDefaultEdgeTemplateSettings(),
  };

  return (
    <Formik
      initialValues={initialValues}
      onSubmit={handleSubmit}
      validationSchema={validation}
      validateOnMount
    >
      <InnerForm isLoading={mutation.isLoading || isSaveCredentialsLoading} />
    </Formik>
  );

  async function handleSubmit(values: FormValues) {
    const credentialId = await saveCredentials(values.Git);

    mutation.mutate(
      {
        ...values,
        EdgeTemplate: true,
        Git: toGitRequest(values.Git, credentialId),
      },
      {
        onSuccess() {
          notifySuccess('Success', 'Template created');
          router.stateService.go('^');
        },
      }
    );
  }
}

function useParams() {
  const {
    params: { type = StackType.DockerCompose, appTemplateId },
  } = useCurrentStateAndParams();

  return {
    type: getStackType(type),
    appTemplateId: getTemplateId(appTemplateId),
  };

  function getStackType(type: string): StackType {
    const typeNum = parseInt(type, 10);

    if (
      [
        StackType.DockerSwarm,
        StackType.DockerCompose,
        StackType.Kubernetes,
      ].includes(typeNum)
    ) {
      return typeNum;
    }

    return StackType.DockerCompose;
  }

  function getTemplateId(appTemplateId: string): number | undefined {
    const id = parseInt(appTemplateId, 10);

    return Number.isNaN(id) ? undefined : id;
  }
}

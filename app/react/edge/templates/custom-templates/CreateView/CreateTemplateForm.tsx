import { Formik } from 'formik';
import { useCurrentStateAndParams, useRouter } from '@uirouter/react';

import { StackType } from '@/react/common/stacks/types';
import { notifySuccess } from '@/portainer/services/notifications';
import { useCreateTemplateMutation } from '@/react/portainer/templates/custom-templates/queries/useCreateTemplateMutation';
import { Platform } from '@/react/portainer/templates/types';
import { useFetchTemplateFile } from '@/react/portainer/templates/app-templates/queries/useFetchTemplateFile';

import { editor } from '@@/BoxSelector/common-options/build-methods';

import { InnerForm } from './InnerForm';
import { FormValues } from './types';
import { useValidation } from './useValidation';

export function CreateTemplateForm() {
  const router = useRouter();
  const mutation = useCreateTemplateMutation();
  const validation = useValidation();
  const {
    params: { type = StackType.DockerCompose, appTemplateId },
  } = useCurrentStateAndParams();

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
  };

  return (
    <Formik
      initialValues={initialValues}
      onSubmit={handleSubmit}
      validationSchema={validation}
      validateOnMount
    >
      <InnerForm isLoading={mutation.isLoading} />
    </Formik>
  );

  function handleSubmit(values: FormValues) {
    mutation.mutate(
      { ...values, EdgeTemplate: true },
      {
        onSuccess() {
          notifySuccess('Success', 'Template created');
          router.stateService.go('^');
        },
      }
    );
  }
}

import { Formik } from 'formik';
import { useCurrentStateAndParams, useRouter } from '@uirouter/react';
import { useState } from 'react';
import uuidv4 from 'uuid/v4';

import { EnvironmentId } from '@/react/portainer/environments/types';
import {
  useCreateStack,
  CreateStackPayload,
} from '@/react/common/stacks/queries/useCreateStack/useCreateStack';
import { useCurrentUser, useIsEdgeAdmin } from '@/react/hooks/useUser';
import { defaultValues } from '@/react/portainer/access-control/utils';
import { getDefaultModel } from '@/react/portainer/gitops/types';
import { notifySuccess } from '@/portainer/services/notifications';

import { FormValues } from './types';
import { useValidationSchema } from './useValidationSchema';
import { CreateStackInnerForm } from './CreateStackInnerForm';

interface Props {
  environmentId: EnvironmentId;
  isSwarm: boolean;
  swarmId: string;
}

export function CreateStackForm({ environmentId, isSwarm, swarmId }: Props) {
  const router = useRouter();
  const {
    params: { yaml },
  } = useCurrentStateAndParams();
  const createStackMutation = useCreateStack();
  const { user } = useCurrentUser();
  const { isAdmin } = useIsEdgeAdmin();
  const [webhookId] = useState(() => uuidv4());
  const validationSchema = useValidationSchema(environmentId);

  const initialValues: FormValues = {
    method: 'editor',
    name: '',
    editor: {
      fileContent: yaml || '',
    },
    upload: {
      file: null,
    },
    git: {
      ...getDefaultModel(),
      SupportRelativePath: false,
      FilesystemPath: '',
    },
    template: {
      fileContent: '',
      selectedId: undefined,
      variables: [],
    },
    env: [],
    enableWebhook: false,
    registries: [],
    accessControl: defaultValues(isAdmin, user.Id),
  };

  return (
    <Formik
      initialValues={initialValues}
      onSubmit={handleSubmit}
      validationSchema={validationSchema}
      validateOnMount
    >
      <CreateStackInnerForm
        isDeploying={createStackMutation.isLoading}
        isSwarm={isSwarm}
        isSaved={createStackMutation.isSuccess}
        webhookId={webhookId}
      />
    </Formik>
  );

  async function handleSubmit(values: FormValues) {
    const stackType = isSwarm ? 'swarm' : 'standalone';

    const payload = buildCreateStackPayload({
      values,
      environmentId,
      stackType,
      swarmId,
      webhookId,
    });

    createStackMutation.mutate(payload, {
      onSuccess: (stack) => {
        notifySuccess('Success', 'Stack successfully created');
        router.stateService.go('docker.stacks.stack', {
          name: stack.Name,
          id: stack.Id,
          type: stack.Type,
          regular: 'true',
        });
      },
    });
  }
}

function buildCreateStackPayload({
  environmentId,
  stackType,
  swarmId,
  values,
  webhookId,
}: {
  values: FormValues;
  environmentId: EnvironmentId;
  stackType: 'swarm' | 'standalone';
  swarmId: string;
  webhookId: string;
}): CreateStackPayload {
  const basePayload = {
    name: values.name,
    environmentId,
    env: values.env,
    accessControl: values.accessControl,
    registries: values.registries,
  };

  switch (values.method) {
    case 'editor':
      if (stackType === 'swarm') {
        return {
          type: 'swarm',
          method: 'string',
          payload: {
            ...basePayload,
            swarmId,
            fileContent: values.editor.fileContent,
            webhook: values.enableWebhook ? webhookId : undefined,
          },
        };
      }
      return {
        type: 'standalone',
        method: 'string',
        payload: {
          ...basePayload,
          fileContent: values.editor.fileContent,
          webhook: values.enableWebhook ? webhookId : undefined,
        },
      };

    case 'upload':
      if (!values.upload.file) {
        throw new Error('File is required for upload method');
      }
      if (stackType === 'swarm') {
        return {
          type: 'swarm',
          method: 'file',
          payload: {
            ...basePayload,
            swarmId,
            file: values.upload.file,
            webhook: values.enableWebhook ? webhookId : undefined,
          },
        };
      }
      return {
        type: 'standalone',
        method: 'file',
        payload: {
          ...basePayload,
          file: values.upload.file,
          webhook: values.enableWebhook ? webhookId : undefined,
        },
      };

    case 'repository':
      if (stackType === 'swarm') {
        return {
          type: 'swarm',
          method: 'git',
          payload: {
            ...basePayload,
            webhook: webhookId,
            swarmId,
            git: values.git,
            relativePathSettings: values.git.SupportRelativePath
              ? {
                  SupportRelativePath: true,
                  FilesystemPath: values.git.FilesystemPath,
                  SupportPerDeviceConfigs: false,
                  PerDeviceConfigsPath: '',
                  PerDeviceConfigsMatchType: '',
                  PerDeviceConfigsGroupMatchType: '',
                }
              : undefined,
          },
        };
      }
      return {
        type: 'standalone',
        method: 'git',
        payload: {
          ...basePayload,
          git: values.git,
          webhook: webhookId,
          relativePathSettings: values.git.SupportRelativePath
            ? {
                SupportRelativePath: true,
                FilesystemPath: values.git.FilesystemPath,
                SupportPerDeviceConfigs: false,
                PerDeviceConfigsPath: '',
                PerDeviceConfigsMatchType: '',
                PerDeviceConfigsGroupMatchType: '',
              }
            : undefined,
        },
      };

    case 'template':
      if (stackType === 'swarm') {
        return {
          type: 'swarm',
          method: 'string',
          payload: {
            ...basePayload,
            swarmId,
            fileContent: values.template.fileContent,
            webhook: values.enableWebhook ? webhookId : undefined,
            fromAppTemplate: true,
          },
        };
      }
      return {
        type: 'standalone',
        method: 'string',
        payload: {
          ...basePayload,
          fileContent: values.template.fileContent,
          webhook: values.enableWebhook ? webhookId : undefined,
          fromAppTemplate: true,
        },
      };

    default:
      throw new Error('Invalid method');
  }
}

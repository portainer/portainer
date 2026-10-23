import { useState } from 'react';
import { Formik } from 'formik';

import { Stack, StackType } from '@/react/common/stacks/types';
import { toGitFormModel } from '@/react/portainer/gitops/types';
import { parseAutoUpdateResponse } from '@/react/portainer/gitops/AutoUpdateFieldset/utils';
import { createWebhookId } from '@/portainer/helpers/webhookHelper';
import { notifyError, notifySuccess } from '@/portainer/services/notifications';
import { confirmStackUpdate } from '@/react/common/stacks/common/confirm-stack-update';

import { useUpdateGitStack } from './useUpdateGitStack';
import { FormValues } from './types';
import { InnerForm } from './InnerForm';
import { useValidationSchema } from './validation';

interface Props {
  onClose: () => void;
  stack: Stack;
}

export function EditGitSettingsModal({ stack, onClose }: Props) {
  const validationSchema = useValidationSchema(stack.Type);
  const [webhookId] = useState(
    () => stack.AutoUpdate?.Webhook || createWebhookId()
  );

  const mutation = useUpdateGitStack(stack);

  const gitModel = toGitFormModel(
    stack.GitSourceId,
    {
      ReferenceName: stack.GitConfig?.ReferenceName ?? '',
      ConfigFilePath: stack.GitConfig?.ConfigFilePath ?? '',
    },
    parseAutoUpdateResponse(stack.AutoUpdate)
  );

  const initialValues: FormValues = {
    kube: { name: stack.Name },
    git: {
      ...gitModel,
      AdditionalFiles: stack.AdditionalFiles || [],
      SourceId: stack.GitSourceId,
    },
    env: stack.Env || [],
    prune: stack.Option?.Prune || false,
    redeployNow: false,
  };

  return (
    <Formik
      initialValues={initialValues}
      onSubmit={handleSubmit}
      validationSchema={validationSchema}
    >
      <InnerForm
        stackName={stack.Name}
        stackType={stack.Type}
        webhookId={webhookId}
        onDismiss={onClose}
        isSubmitting={mutation.isLoading}
      />
    </Formik>
  );

  async function handleSubmit(values: FormValues) {
    let repullImageAndRedeploy: boolean | undefined;
    if (values.redeployNow) {
      const result = await confirmStackUpdate(
        'Any changes to this stack or application made locally in Portainer will be overridden, which may cause service interruption. Do you wish to continue?',
        stack.Type === StackType.DockerSwarm
      );
      if (!result) {
        return;
      }
      repullImageAndRedeploy = result.repullImageAndRedeploy;
    }

    mutation.mutate(
      {
        values,
        repullImageAndRedeploy,
        webhookId,
      },
      {
        onSuccess({ redeployAttempted, redeployFailed, redeployError }) {
          if (redeployFailed) {
            notifyError(
              'Failure',
              redeployError,
              'Stack settings saved but redeploy failed'
            );
          } else if (redeployAttempted) {
            notifySuccess('Success', 'Stack deployed successfully');
          } else {
            notifySuccess('Success', 'Stack settings saved successfully');
          }
          onClose();
        },
      }
    );
  }
}

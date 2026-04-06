import { Formik, FormikHelpers } from 'formik';
import { useState } from 'react';
import { useRouter } from '@uirouter/react';

import { GitStackPayload, Stack, StackType } from '@/react/common/stacks/types';
import { createWebhookId } from '@/portainer/helpers/webhookHelper';
import { notifyError, notifySuccess } from '@/portainer/services/notifications';
import { confirmStackUpdate } from '@/react/common/stacks/common/confirm-stack-update';
import {
  parseAutoUpdateResponse,
  transformAutoUpdateViewModel,
} from '@/react/portainer/gitops/AutoUpdateFieldset/utils';
import { useUpdateGitStack } from '@/react/portainer/gitops/queries/useUpdateGitStack';
import { useUpdateGitStackSettings } from '@/react/portainer/gitops/queries/useUpdateGitStackSettings';

import { useValidationSchema } from './useValidationSchema';
import { FormValues } from './types';
import { InnerForm } from './InnerForm';

export function StackRedeployGitForm({ stack }: { stack: Stack }) {
  const router = useRouter();
  const deployMutation = useUpdateGitStack(stack.Id, stack.EndpointId);
  const updateSettingsMutation = useUpdateGitStackSettings();

  const validationSchema = useValidationSchema({
    isAuthEdit: !!stack.GitConfig?.Authentication,
  });

  const [webhookId] = useState(() => {
    if (!stack.AutoUpdate?.Webhook) {
      return createWebhookId();
    }

    return stack.AutoUpdate?.Webhook;
  });

  const authValues = stack.GitConfig?.Authentication;
  const initialValues: FormValues = {
    auth: {
      NewCredentialName: '',
      RepositoryAuthentication: !!authValues,
      RepositoryAuthorizationType: authValues?.AuthorizationType,
      RepositoryGitCredentialID: authValues?.GitCredentialID,
      RepositoryPassword: authValues?.Password,
      RepositoryUsername: authValues?.Username,
      SaveCredential: false,
    },
    autoUpdate: parseAutoUpdateResponse(stack.AutoUpdate),
    env: stack.Env || [],
    prune: stack.Option?.Prune || false,
    refName: stack.GitConfig?.ReferenceName || '',
    tlsSkipVerify: stack.GitConfig?.TLSSkipVerify || false,
  };

  return (
    <Formik
      initialValues={initialValues}
      validationSchema={validationSchema}
      onSubmit={handleSaveSettings}
    >
      <InnerForm
        stack={stack}
        webhookId={webhookId}
        isSaveLoading={updateSettingsMutation.isLoading}
        isDeployLoading={deployMutation.isLoading}
        onDeploy={handleDeploy}
      />
    </Formik>
  );

  function handleSaveSettings(
    values: FormValues,
    { resetForm }: FormikHelpers<FormValues>
  ) {
    const autoUpdate = transformAutoUpdateViewModel(
      values.autoUpdate,
      webhookId
    );
    const payload: GitStackPayload = {
      AutoUpdate: autoUpdate,
      env: values.env,
      RepositoryReferenceName: values.refName,
      RepositoryAuthentication: values.auth.RepositoryAuthentication,
      RepositoryGitCredentialID: values.auth.RepositoryGitCredentialID,
      RepositoryUsername: values.auth.RepositoryUsername,
      RepositoryPassword: values.auth.RepositoryPassword,
      RepositoryAuthorizationType: values.auth.RepositoryAuthorizationType,
      prune: values.prune,
      TLSSkipVerify: values.tlsSkipVerify,
    };

    updateSettingsMutation.mutate(
      {
        stackId: stack.Id,
        endpointId: stack.EndpointId,
        payload,
      },
      {
        onError(err) {
          notifyError('Failure', err as Error, 'Unable to save stack settings');
        },
        onSuccess() {
          notifySuccess('Success', 'Save stack settings successfully');
          resetForm({ values });
        },
      }
    );
  }

  async function handleDeploy(values: FormValues) {
    const isSwarmStack = stack.Type === StackType.DockerSwarm;
    const result = await confirmStackUpdate(
      'Any changes to this stack or application made locally in Portainer will be overridden, which may cause service interruption. Do you wish to continue?',
      isSwarmStack
    );

    if (!result) {
      return;
    }

    const payload: GitStackPayload = {
      RepullImageAndRedeploy: result.repullImageAndRedeploy,
      env: values.env,
      RepositoryReferenceName: values.refName,
      RepositoryAuthentication: values.auth.RepositoryAuthentication,
      RepositoryGitCredentialID: values.auth.RepositoryGitCredentialID,
      RepositoryUsername: values.auth.RepositoryUsername,
      RepositoryPassword: values.auth.RepositoryPassword,
      RepositoryAuthorizationType: values.auth.RepositoryAuthorizationType,
      prune: values.prune,
      TLSSkipVerify: values.tlsSkipVerify,
    };

    deployMutation.mutate(payload, {
      onError(err) {
        notifyError('Failure', err as Error, 'Failed redeploying stack');
      },
      onSuccess() {
        notifySuccess('Success', 'Pulled and redeployed stack successfully');
        router.stateService.reload();
      },
    });
  }
}

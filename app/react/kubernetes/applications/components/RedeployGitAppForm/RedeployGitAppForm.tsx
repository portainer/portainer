import { Formik, FormikHelpers } from 'formik';
import { useRef } from 'react';

import {
  UpdateKubeGitStackPayload,
  useUpdateKubeGitStackMutation,
} from '@/react/common/stacks/queries/useUpdateKubeGitStackMutation';
import { Stack, StackId } from '@/react/common/stacks/types';
import {
  parseAutoUpdateResponse,
  transformAutoUpdateViewModel,
} from '@/react/portainer/gitops/AutoUpdateFieldset/utils';
import { AutoUpdateMechanism } from '@/react/portainer/gitops/types';
import { createWebhookId } from '@/portainer/helpers/webhookHelper';
import { parseAuthResponse } from '@/react/portainer/gitops/AuthFieldset/utils';
import { useGitCredentials } from '@/react/portainer/account/git-credentials/git-credentials.service';
import { useCurrentUser } from '@/react/hooks/useUser';
import { useAnalytics } from '@/react/hooks/useAnalytics';
import { RepositoryMechanismTypes } from '@/kubernetes/models/deploy';
import { useEnvironmentId } from '@/react/hooks/useEnvironmentId';
import { notifySuccess } from '@/portainer/services/notifications';
import { useStack } from '@/react/common/stacks/queries/useStack';

import { FormSection } from '@@/form-components/FormSection';
import { InlineLoader } from '@@/InlineLoader';
import { Alert } from '@@/Alert';

import { KubeAppGitFormValues } from './types';
import { redeployGitAppFormValidationSchema } from './redeployGitAppFormValidationSchema';
import { RedeployGitAppInnerForm } from './RedeployGitAppInnerForm';

type Props = {
  stackId: StackId;
  namespaceName: string;
};

export function RedeployGitAppForm({ stackId, namespaceName }: Props) {
  const { data: stack, ...stackQuery } = useStack(stackId);
  const { trackEvent } = useAnalytics();
  const initialValues = getInitialValues(stack);
  const { user } = useCurrentUser();
  const { data: gitCredentials, ...gitCredentialsQuery } = useGitCredentials(
    user.Id
  );
  const environmentId = useEnvironmentId();
  const updateKubeGitStackMutation = useUpdateKubeGitStackMutation(
    stack?.Id || 0,
    environmentId,
    user.Id
  );
  // keep a single generated webhook id, so that it doesn't change on every render
  const generatedWebhookId = useRef(createWebhookId());
  const webhookId = stack?.AutoUpdate?.Webhook || generatedWebhookId.current;

  if (!initialValues) {
    return null;
  }
  const isAuthEdit = !!initialValues.authentication.RepositoryUsername;

  if (stackQuery.isLoading || gitCredentialsQuery.isLoading) {
    return (
      <InlineLoader>Loading application git configuration...</InlineLoader>
    );
  }

  if (stackQuery.isError) {
    return (
      <Alert color="error">Unable to load application git configuration.</Alert>
    );
  }

  if (!stack) {
    return null;
  }

  return (
    <FormSection titleSize="lg" title="Redeploy from git repository">
      <div className="form-group text-muted">
        <div className="col-sm-12">
          <p>Pull the latest manifest from git and redeploy the application.</p>
        </div>
      </div>
      <Formik<KubeAppGitFormValues>
        initialValues={initialValues}
        validationSchema={() =>
          redeployGitAppFormValidationSchema(gitCredentials || [], isAuthEdit)
        }
        onSubmit={handleSubmit}
      >
        <RedeployGitAppInnerForm
          stack={stack}
          namespaceName={namespaceName}
          webhookId={webhookId}
        />
      </Formik>
    </FormSection>
  );

  async function handleSubmit(
    values: KubeAppGitFormValues,
    { resetForm }: FormikHelpers<KubeAppGitFormValues>
  ) {
    trackSubmit(values);

    // update the kubernetes git stack
    const { authentication } = values;
    const updateKubeGitStack: UpdateKubeGitStackPayload = {
      RepositoryReferenceName: values.repositoryReferenceName,
      AutoUpdate: transformAutoUpdateViewModel(values.autoUpdate, webhookId),
      TLSSkipVerify: values.tlsSkipVerify,
      ...authentication,
    };
    await updateKubeGitStackMutation.mutateAsync(
      { stack: updateKubeGitStack, authentication },
      {
        onSuccess: ({ data: newStack }) => {
          const newInitialValues = getInitialValues(newStack);
          notifySuccess('Success', 'Application saved successfully.');
          resetForm({ values: newInitialValues });
        },
      }
    );
  }

  function trackSubmit(values: KubeAppGitFormValues) {
    trackEvent('kubernetes-application-edit', {
      category: 'kubernetes',
      metadata: {
        'automatic-updates': automaticUpdatesLabel(
          values.autoUpdate.RepositoryAutomaticUpdates,
          values.autoUpdate.RepositoryMechanism
        ),
      },
    });
    function automaticUpdatesLabel(
      repositoryAutomaticUpdates: boolean,
      repositoryMechanism: AutoUpdateMechanism
    ) {
      switch (repositoryAutomaticUpdates && repositoryMechanism) {
        case RepositoryMechanismTypes.INTERVAL:
          return 'polling';
        case RepositoryMechanismTypes.WEBHOOK:
          return 'webhook';
        default:
          return 'off';
      }
    }
  }
}

function getInitialValues(stack?: Stack): KubeAppGitFormValues | undefined {
  if (!stack || !stack.GitConfig) {
    return undefined;
  }
  const autoUpdate = parseAutoUpdateResponse(stack.AutoUpdate);
  const authentication = parseAuthResponse(stack.GitConfig?.Authentication);
  return {
    authentication,
    repositoryReferenceName: stack.GitConfig.ReferenceName,
    repositoryURL: stack.GitConfig.URL,
    tlsSkipVerify: stack.GitConfig.TLSSkipVerify,
    autoUpdate,
  };
}

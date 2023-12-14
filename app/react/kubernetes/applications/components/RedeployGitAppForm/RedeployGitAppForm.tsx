import { Form, Formik, FormikHelpers, useFormikContext } from 'formik';
import { useRef, useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { useRouter } from '@uirouter/react';

import { Stack, StackId } from '@/react/common/stacks/types';
import {
  parseAutoUpdateResponse,
  transformAutoUpdateViewModel,
} from '@/react/portainer/gitops/AutoUpdateFieldset/utils';
import { AutoUpdateFieldset } from '@/react/portainer/gitops/AutoUpdateFieldset';
import {
  AutoUpdateMechanism,
  AutoUpdateModel,
} from '@/react/portainer/gitops/types';
import {
  baseStackWebhookUrl,
  createWebhookId,
} from '@/portainer/helpers/webhookHelper';
import { TimeWindowDisplay } from '@/react/portainer/gitops/TimeWindowDisplay';
import { RefField } from '@/react/portainer/gitops/RefField';
import { parseAuthResponse } from '@/react/portainer/gitops/AuthFieldset/utils';
import { confirmEnableTLSVerify } from '@/react/portainer/gitops/utils';
import { AuthFieldset } from '@/react/portainer/gitops/AuthFieldset';
import { useGitCredentials } from '@/react/portainer/account/git-credentials/git-credentials.service';
import { useCurrentUser } from '@/react/hooks/useUser';
import { useAnalytics } from '@/react/hooks/useAnalytics';
import { RepositoryMechanismTypes } from '@/kubernetes/models/deploy';
import { useCreateGitCredentialMutation } from '@/react/portainer/account/git-credentials/queries/useCreateGitCredentialsMutation';
import { useEnvironmentId } from '@/react/hooks/useEnvironmentId';
import { notifySuccess } from '@/portainer/services/notifications';
import { useStackQuery } from '@/react/common/stacks/queries/useStackQuery';

import { FormSection } from '@@/form-components/FormSection';
import { SwitchField } from '@@/form-components/SwitchField';
import { LoadingButton } from '@@/buttons';
import { buildConfirmButton } from '@@/modals/utils';
import { confirm } from '@@/modals/confirm';
import { ModalType } from '@@/modals';
import { InlineLoader } from '@@/InlineLoader';
import { Alert } from '@@/Alert';

import { useUpdateKubeGitStackMutation } from './queries/useUpdateKubeGitStackMutation';
import {
  KubeAppGitFormValues,
  RedeployGitStackPayload,
  UpdateKubeGitStackPayload,
} from './types';
import { redeployGitAppFormValidationSchema } from './redeployGitAppFormValidationSchema';
import { useRedeployKubeGitStackMutation } from './queries/useRedeployKubeGitStackMutation';

type Props = {
  stackId: StackId;
  namespaceName: string;
};

export function RedeployGitAppForm({ stackId, namespaceName }: Props) {
  const { data: stack, ...stackQuery } = useStackQuery(stackId);
  const { trackEvent } = useAnalytics();
  const initialValues = getInitialValues(stack);
  const { user } = useCurrentUser();
  const { data: gitCredentials, ...gitCredentialsQuery } = useGitCredentials(
    user.Id
  );
  const environmentId = useEnvironmentId();
  const createGitCredentialMutation = useCreateGitCredentialMutation();
  const updateKubeGitStackMutation = useUpdateKubeGitStackMutation(
    stack?.Id || 0,
    environmentId
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

    // save the new git credentials if the user has selected to save them
    if (
      values.authentication.SaveCredential &&
      values.authentication.NewCredentialName &&
      values.authentication.RepositoryPassword &&
      values.authentication.RepositoryUsername
    ) {
      createGitCredentialMutation.mutate({
        name: values.authentication.NewCredentialName,
        username: values.authentication.RepositoryUsername,
        password: values.authentication.RepositoryPassword,
        userId: user.Id,
      });
    }

    // update the kubernetes git stack
    const { authentication } = values;
    const updateKubeGitStack: UpdateKubeGitStackPayload = {
      RepositoryAuthentication:
        !!values.authentication.RepositoryAuthentication,
      RepositoryReferenceName: values.repositoryReferenceName,
      AutoUpdate: transformAutoUpdateViewModel(values.autoUpdate, webhookId),
      TLSSkipVerify: values.tlsSkipVerify,
      RepositoryGitCredentialID: authentication.RepositoryGitCredentialID,
      RepositoryPassword: authentication.RepositoryPassword,
      RepositoryUsername: authentication.RepositoryUsername,
    };
    await updateKubeGitStackMutation.mutateAsync(updateKubeGitStack, {
      onSuccess: ({ data: newStack }) => {
        const newInitialValues = getInitialValues(newStack);
        notifySuccess('Success', 'Application saved successfully.');
        resetForm({ values: newInitialValues });
      },
    });
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

function RedeployGitAppInnerForm({
  stack,
  namespaceName,
  webhookId,
}: {
  stack: Stack;
  namespaceName: string;
  webhookId: string;
}) {
  const router = useRouter();
  const environmentId = useEnvironmentId();
  const redeployKubeGitStackMutation = useRedeployKubeGitStackMutation(
    stack.Id,
    environmentId
  );
  const [isRedeployLoading, setIsRedeployLoading] = useState(false);
  const { trackEvent } = useAnalytics();
  const {
    values,
    errors,
    setFieldValue,
    handleSubmit,
    dirty,
    isValid,
    isSubmitting,
    setFieldTouched,
  } = useFormikContext<KubeAppGitFormValues>();

  return (
    <Form className="form-horizontal" onSubmit={handleSubmit}>
      <AutoUpdateFieldset
        value={values.autoUpdate}
        onChange={(value: AutoUpdateModel) =>
          setFieldValue('autoUpdate', value)
        }
        baseWebhookUrl={baseStackWebhookUrl()}
        webhookId={webhookId}
        errors={errors.autoUpdate}
        environmentType="KUBERNETES"
        isForcePullVisible={false}
        webhooksDocs="https://docs.portainer.io/user/kubernetes/applications/webhooks"
      />
      <TimeWindowDisplay />
      <FormSection title="Advanced configuration" isFoldable>
        <RefField
          value={values.repositoryReferenceName}
          onChange={(refName) =>
            setFieldValue('repositoryReferenceName', refName)
          }
          model={{
            ...values.authentication,
            RepositoryURL: values.repositoryURL,
          }}
          error={errors.repositoryReferenceName}
          stackId={stack.Id}
          isUrlValid
        />
        <AuthFieldset
          value={values.authentication}
          isAuthExplanationVisible
          onChange={(value) =>
            Object.entries(value).forEach(([key, value]) => {
              setFieldValue(key, value);
              // set touched after a delay to revalidate debounced username and access token fields
              setTimeout(() => setFieldTouched(key, true), 400);
            })
          }
          errors={errors.authentication}
        />
        <SwitchField
          name="TLSSkipVerify"
          label="Skip TLS verification"
          labelClass="col-sm-3 col-lg-2"
          tooltip="Enabling this will allow skipping TLS validation for any self-signed certificate."
          checked={values.tlsSkipVerify}
          onChange={onChangeTLSSkipVerify}
        />
      </FormSection>
      <FormSection title="Actions">
        <div className="form-group">
          <div className="col-sm-12">
            <LoadingButton
              type="button"
              onClick={handleRedeploy}
              className="!ml-0"
              loadingText="In progress..."
              isLoading={isRedeployLoading}
              disabled={dirty}
              icon={RefreshCw}
              data-cy="application-redeploy-button"
            >
              Pull and update application
            </LoadingButton>
            <LoadingButton
              type="submit"
              loadingText="In progress..."
              isLoading={isSubmitting}
              disabled={!dirty || !isValid}
              data-cy="application-redeploy-button"
            >
              Save settings
            </LoadingButton>
          </div>
        </div>
      </FormSection>
    </Form>
  );

  async function handleRedeploy() {
    const confirmed = await confirm({
      title: 'Are you sure?',
      message:
        'Any changes to this application will be overridden by the definition in git and may cause a service interruption. Do you wish to continue?',
      confirmButton: buildConfirmButton('Update', 'warning'),
      modalType: ModalType.Warn,
    });

    if (!confirmed) {
      return;
    }
    setIsRedeployLoading(true);

    // track the redeploy event
    trackEvent('kubernetes-application-edit-git-pull', {
      category: 'kubernetes',
    });

    // redeploy the application
    const redeployPayload: RedeployGitStackPayload = {
      RepositoryReferenceName: values.repositoryReferenceName,
      RepositoryAuthentication:
        !!values.authentication.RepositoryAuthentication,
      RepositoryGitCredentialID:
        values.authentication.RepositoryGitCredentialID,
      RepositoryPassword: values.authentication.RepositoryPassword,
      RepositoryUsername: values.authentication.RepositoryUsername,
      Namespace: namespaceName,
    };
    await redeployKubeGitStackMutation.mutateAsync(redeployPayload, {
      onSuccess: () => {
        notifySuccess('Success', 'Application redeployed successfully.');
        router.stateService.go('kubernetes.applications.application', {
          id: stack.Id,
        });
      },
    });

    setIsRedeployLoading(false);
  }

  async function onChangeTLSSkipVerify(value: boolean) {
    // If the user is disabling TLS verification, ask for confirmation
    if (stack.GitConfig?.TLSSkipVerify && !value) {
      const confirmed = await confirmEnableTLSVerify();
      if (!confirmed) {
        return;
      }
    }
    setFieldValue('tlsSkipVerify', value);
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

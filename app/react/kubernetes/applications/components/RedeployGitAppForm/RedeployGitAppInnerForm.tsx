import { Form, useFormikContext } from 'formik';
import { useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { useRouter } from '@uirouter/react';

import { Stack } from '@/react/common/stacks/types';
import { AutoUpdateFieldset } from '@/react/portainer/gitops/AutoUpdateFieldset';
import { AutoUpdateModel } from '@/react/portainer/gitops/types';
import { baseStackWebhookUrl } from '@/portainer/helpers/webhookHelper';
import { TimeWindowDisplay } from '@/react/portainer/gitops/TimeWindowDisplay';
import { RefField } from '@/react/portainer/gitops/RefField';
import { confirmEnableTLSVerify } from '@/react/portainer/gitops/utils';
import { AuthFieldset } from '@/react/portainer/gitops/AuthFieldset';
import { useAnalytics } from '@/react/hooks/useAnalytics';
import { useEnvironmentId } from '@/react/hooks/useEnvironmentId';
import { notifySuccess } from '@/portainer/services/notifications';

import { FormSection } from '@@/form-components/FormSection';
import { SwitchField } from '@@/form-components/SwitchField';
import { LoadingButton } from '@@/buttons';
import { buildConfirmButton } from '@@/modals/utils';
import { confirm } from '@@/modals/confirm';
import { ModalType } from '@@/modals';
import { FormActions } from '@@/form-components/FormActions';

import { KubeAppGitFormValues, RedeployGitStackPayload } from './types';
import { useRedeployKubeGitStackMutation } from './queries/useRedeployKubeGitStackMutation';

type Props = {
  stack: Stack;
  namespaceName: string;
  webhookId: string;
};

export function RedeployGitAppInnerForm({
  stack,
  namespaceName,
  webhookId,
}: Props) {
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
      <FormActions
        submitLabel="Save settings"
        loadingText="In progress..."
        isLoading={isSubmitting}
        isValid={dirty && isValid}
        data-cy="application-git-save-button"
      >
        <LoadingButton
          type="button"
          color="secondary"
          onClick={handleRedeploy}
          loadingText="In progress..."
          isLoading={isRedeployLoading}
          disabled={dirty}
          icon={RefreshCw}
          data-cy="application-redeploy-button"
        >
          Pull and update application
        </LoadingButton>
      </FormActions>
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

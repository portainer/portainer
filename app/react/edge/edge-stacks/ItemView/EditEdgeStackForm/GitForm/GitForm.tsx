import { Form, Formik, useFormikContext } from 'formik';
import { useRouter } from '@uirouter/react';
import { useTranslation } from 'react-i18next';

import { AuthFieldset } from '@/react/portainer/gitops/AuthFieldset';
import { AutoUpdateFieldset } from '@/react/portainer/gitops/AutoUpdateFieldset';
import { isBE } from '@/react/portainer/feature-flags/feature-flags.service';
import {
  parseAutoUpdateResponse,
  transformAutoUpdateViewModel,
} from '@/react/portainer/gitops/AutoUpdateFieldset/utils';
import { InfoPanel } from '@/react/portainer/gitops/InfoPanel';
import { RefField } from '@/react/portainer/gitops/RefField';
import {
  AutoUpdateModel,
  GitAuthModel,
  RelativePathModel,
} from '@/react/portainer/gitops/types';
import {
  baseEdgeStackWebhookUrl,
  createWebhookId,
} from '@/portainer/helpers/webhookHelper';
import {
  parseAuthResponse,
  transformGitAuthenticationViewModel,
} from '@/react/portainer/gitops/AuthFieldset/utils';
import { EdgeGroup } from '@/react/edge/edge-groups/types';
import { DeploymentType, EdgeStack } from '@/react/edge/edge-stacks/types';
import { EdgeGroupsSelector } from '@/react/edge/edge-stacks/components/EdgeGroupsSelector';
import { EdgeStackDeploymentTypeSelector } from '@/react/edge/edge-stacks/components/EdgeStackDeploymentTypeSelector';
import { notifySuccess } from '@/portainer/services/notifications';
import { EnvironmentType } from '@/react/portainer/environments/types';
import { Registry } from '@/react/portainer/registries/types/registry';
import { useRegistries } from '@/react/portainer/registries/queries/useRegistries';
import { RelativePathFieldset } from '@/react/portainer/gitops/RelativePathFieldset/RelativePathFieldset';
import { parseRelativePathResponse } from '@/react/portainer/gitops/RelativePathFieldset/utils';
import { useSaveCredentialsIfRequired } from '@/react/portainer/account/git-credentials/queries/useCreateGitCredentialsMutation';

import { LoadingButton } from '@@/buttons';
import { FormSection } from '@@/form-components/FormSection';
import { TextTip } from '@@/Tip/TextTip';
import { FormError } from '@@/form-components/FormError';
import { EnvironmentVariablesPanel } from '@@/form-components/EnvironmentVariablesFieldset';
import { EnvVar } from '@@/form-components/EnvironmentVariablesFieldset/types';

import { useEdgeGroupHasType } from '../useEdgeGroupHasType';
import { PrivateRegistryFieldset } from '../../../components/PrivateRegistryFieldset';

import {
  UpdateEdgeStackGitPayload,
  useUpdateEdgeStackGitMutation,
} from './useUpdateEdgeStackGitMutation';

interface FormValues {
  groupIds: EdgeGroup['Id'][];
  deploymentType: DeploymentType;
  autoUpdate: AutoUpdateModel;
  refName: string;
  authentication: GitAuthModel;
  envVars: EnvVar[];
  privateRegistryId?: Registry['Id'];
  relativePath: RelativePathModel;
}

export function GitForm({ stack }: { stack: EdgeStack }) {
  const { t } = useTranslation();
  const router = useRouter();
  const updateStackMutation = useUpdateEdgeStackGitMutation();
  const { saveCredentials, isLoading: isSaveCredentialsLoading } =
    useSaveCredentialsIfRequired();

  if (!stack.GitConfig) {
    return null;
  }

  const gitConfig = stack.GitConfig;

  const initialValues: FormValues = {
    groupIds: stack.EdgeGroups,
    deploymentType: stack.DeploymentType,
    autoUpdate: parseAutoUpdateResponse(stack.AutoUpdate),
    refName: stack.GitConfig.ReferenceName,
    authentication: parseAuthResponse(stack.GitConfig.Authentication),
    relativePath: parseRelativePathResponse(stack),
    envVars: stack.EnvVars || [],
  };

  const webhookId = stack.AutoUpdate?.Webhook || createWebhookId();

  return (
    <Formik initialValues={initialValues} onSubmit={handleSubmit}>
      {({ values, isValid }) => {
        return (
          <InnerForm
            webhookId={webhookId}
            onUpdateSettingsClick={handleUpdateSettings}
            gitPath={gitConfig.ConfigFilePath}
            gitUrl={gitConfig.URL}
            isLoading={
              updateStackMutation.isLoading || isSaveCredentialsLoading
            }
            isUpdateVersion={!!updateStackMutation.variables?.updateVersion}
          />
        );

        async function handleUpdateSettings() {
          if (!isValid) {
            return;
          }

          const credentialId = await saveCredentials(values.authentication);

          updateStackMutation.mutate(getPayload(values, credentialId, false), {
            onSuccess() {
              notifySuccess(t('common.success'), t('edge.stacks.edit.update_success'));
              router.stateService.reload();
            },
          });
        }
      }}
    </Formik>
  );

  async function handleSubmit(values: FormValues) {
    const credentialId = await saveCredentials(values.authentication);

    updateStackMutation.mutate(getPayload(values, credentialId, true), {
      onSuccess() {
        notifySuccess(t('common.success'), t('edge.stacks.edit.update_success'));
        router.stateService.reload();
      },
    });
  }

  function getPayload(
    { authentication, autoUpdate, privateRegistryId, ...values }: FormValues,
    credentialId: number | undefined,
    updateVersion: boolean
  ): UpdateEdgeStackGitPayload {
    return {
      updateVersion,
      id: stack.Id,
      authentication: transformGitAuthenticationViewModel({
        ...authentication,
        RepositoryGitCredentialID: credentialId,
      }),
      autoUpdate: transformAutoUpdateViewModel(autoUpdate, webhookId),
      registries:
        typeof privateRegistryId !== 'undefined'
          ? [privateRegistryId]
          : undefined,
      ...values,
    };
  }
}

function InnerForm({
  gitUrl,
  gitPath,
  isLoading,
  isUpdateVersion,
  onUpdateSettingsClick,
  webhookId,
}: {
  gitUrl: string;
  gitPath: string;

  isLoading: boolean;
  isUpdateVersion: boolean;
  onUpdateSettingsClick(): void;
  webhookId: string;
}) {
  const registriesQuery = useRegistries();
  const { t } = useTranslation();
  const { values, setFieldValue, isValid, handleSubmit, errors, dirty } =
    useFormikContext<FormValues>();

  const { hasType } = useEdgeGroupHasType(values.groupIds);

  const hasKubeEndpoint = hasType(EnvironmentType.EdgeAgentOnKubernetes);
  const hasDockerEndpoint = hasType(EnvironmentType.EdgeAgentOnDocker);

  return (
    <Form className="form-horizontal" onSubmit={handleSubmit}>
      <EdgeGroupsSelector
        value={values.groupIds}
        onChange={(value) => setFieldValue('groupIds', value)}
        error={errors.groupIds}
      />

      {hasKubeEndpoint && hasDockerEndpoint && (
        <TextTip>
          {t('edge.stacks.create.multiple_types_error')}
        </TextTip>
      )}

      {values.deploymentType === DeploymentType.Compose && hasKubeEndpoint && (
        <FormError>
          {t('edge.stacks.edit.compose_no_kube')}
        </FormError>
      )}
      <EdgeStackDeploymentTypeSelector
        value={values.deploymentType}
        hasDockerEndpoint={hasType(EnvironmentType.EdgeAgentOnDocker)}
        hasKubeEndpoint={hasType(EnvironmentType.EdgeAgentOnKubernetes)}
        onChange={(value) => {
          setFieldValue('deploymentType', value);
        }}
      />

      <FormSection title={t('edge.stacks.edit.update_from_git')}>
        <div className="row small">
          <div className="col-sm-12">
            <InfoPanel
              type="Edge stack"
              currentDeployment={{
                repositoryUrl: gitUrl,
                configFilePath: gitPath,
              }}
            />
          </div>
        </div>

        <AutoUpdateFieldset
          webhookId={webhookId}
          value={values.autoUpdate}
          onChange={(value) =>
            setFieldValue('autoUpdate', {
              ...values.autoUpdate,
              ...value,
            })
          }
          baseWebhookUrl={baseEdgeStackWebhookUrl()}
          errors={errors.autoUpdate}
        />
      </FormSection>

      <FormSection title={t('edge.stacks.edit.advanced_configuration')} isFoldable>
        <RefField
          value={values.refName}
          onChange={(value) => setFieldValue('refName', value)}
          model={{ ...values.authentication, RepositoryURL: gitUrl }}
          error={errors.refName}
          isUrlValid
        />

        <AuthFieldset
          value={values.authentication}
          isAuthExplanationVisible
          onChange={(value) =>
            Object.entries(value).forEach(([key, value]) => {
              setFieldValue(`authentication.${key}`, value);
            })
          }
          errors={errors.authentication}
        />

        {isBE && (
          <RelativePathFieldset
            values={values.relativePath}
            isEditing
            onChange={() => {}}
          />
        )}

        <EnvironmentVariablesPanel
          onChange={(value) => setFieldValue('envVars', value)}
          values={values.envVars}
          errors={errors.envVars}
        />
      </FormSection>

      <PrivateRegistryFieldset
        value={values.privateRegistryId}
        onChange={(value) => setFieldValue('privateRegistryId', value)}
        registries={registriesQuery.data ?? []}
        formInvalid={!isValid}
        method="repository"
        errorMessage={errors.privateRegistryId}
      />

      <FormSection title={t('edge.stacks.edit.actions')}>
        <LoadingButton
          disabled={dirty || !isValid || isLoading}
          data-cy="pull-and-update-stack-button"
          isLoading={isUpdateVersion && isLoading}
          loadingText={t('edge.stacks.edit.updating_stack')}
        >
          {t('edge.stacks.edit.pull_and_update')}
        </LoadingButton>

        <LoadingButton
          type="button"
          disabled={!dirty || !isValid || isLoading}
          isLoading={!isUpdateVersion && isLoading}
          loadingText={t('edge.stacks.edit.updating_settings')}
          onClick={onUpdateSettingsClick}
          data-cy="edge-stack-update-settings-button"
        >
          {t('edge.stacks.edit.update_settings')}
        </LoadingButton>
      </FormSection>
    </Form>
  );
}

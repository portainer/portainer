import { useState } from 'react';
import { Form, Formik, useFormikContext } from 'formik';
import { useRouter } from '@uirouter/react';
import { array, number, object } from 'yup';

import { AutoUpdateFieldset } from '@/react/portainer/gitops/AutoUpdateFieldset';
import { GitSourceSelector } from '@/react/portainer/gitops/sources/GitSourceSelector';
import {
  parseAutoUpdateResponse,
  transformAutoUpdateViewModel,
} from '@/react/portainer/gitops/AutoUpdateFieldset/utils';
import { RefField } from '@/react/portainer/gitops/RefField';
import {
  AutoUpdateModel,
  RelativePathModel,
} from '@/react/portainer/gitops/types';
import {
  baseEdgeStackWebhookUrl,
  createWebhookId,
} from '@/portainer/helpers/webhookHelper';
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
import { isBE } from '@/react/portainer/feature-flags/feature-flags.service';
import { GitReferenceCard } from '@/react/portainer/gitops/GitReferenceCard';

import { LoadingButton } from '@@/buttons';
import { FormSection } from '@@/form-components/FormSection';
import { TextTip } from '@@/Tip/TextTip';
import { FormError } from '@@/form-components/FormError';
import { EnvironmentVariablesPanel } from '@@/form-components/EnvironmentVariablesFieldset';
import { EnvVar } from '@@/form-components/EnvironmentVariablesFieldset/types';
import { Link } from '@@/Link';

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
  envVars: EnvVar[];
  privateRegistryId?: Registry['Id'];
  relativePath: RelativePathModel;
}

export function GitForm({ stack }: { stack: EdgeStack }) {
  const router = useRouter();
  const updateStackMutation = useUpdateEdgeStackGitMutation();

  const [webhookId] = useState(
    () => stack.AutoUpdate?.Webhook || createWebhookId()
  );

  if (!stack.GitConfig) {
    return null;
  }

  const initialValues: FormValues = {
    groupIds: stack.EdgeGroups,
    deploymentType: stack.DeploymentType,
    autoUpdate: parseAutoUpdateResponse(stack.AutoUpdate),
    refName: stack.GitConfig.ReferenceName,
    relativePath: parseRelativePathResponse(stack),
    envVars: stack.EnvVars || [],
  };

  return (
    <Formik
      initialValues={initialValues}
      onSubmit={handleSubmit}
      validationSchema={formValidation()}
    >
      {({ values, isValid }) => {
        return (
          <InnerForm
            webhookId={webhookId}
            onUpdateSettingsClick={handleUpdateSettings}
            isLoading={updateStackMutation.isLoading}
            isUpdateVersion={!!updateStackMutation.variables?.updateVersion}
            stack={stack}
          />
        );

        async function handleUpdateSettings() {
          if (!isValid) {
            return;
          }

          updateStackMutation.mutate(getPayload(values, false), {
            onSuccess() {
              notifySuccess('Success', 'Stack updated successfully');
              router.stateService.reload();
            },
          });
        }
      }}
    </Formik>
  );

  async function handleSubmit(values: FormValues) {
    updateStackMutation.mutate(getPayload(values, true), {
      onSuccess() {
        notifySuccess('Success', 'Stack updated successfully');
        router.stateService.reload();
      },
    });
  }

  function getPayload(
    { autoUpdate, privateRegistryId, ...values }: FormValues,
    updateVersion: boolean
  ): UpdateEdgeStackGitPayload {
    return {
      updateVersion,
      id: stack.Id,
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
  isLoading,
  isUpdateVersion,
  onUpdateSettingsClick,
  webhookId,
  stack,
}: {
  isLoading: boolean;
  isUpdateVersion: boolean;
  onUpdateSettingsClick(): void;
  webhookId: string;
  stack: EdgeStack;
}) {
  const registriesQuery = useRegistries();
  const { values, setFieldValue, isValid, handleSubmit, errors, dirty } =
    useFormikContext<FormValues>();

  const { hasType } = useEdgeGroupHasType(values.groupIds);

  const hasKubeEndpoint = hasType(EnvironmentType.EdgeAgentOnKubernetes);
  const hasDockerEndpoint = hasType(EnvironmentType.EdgeAgentOnDocker);

  if (!stack.GitConfig || !stack.GitSourceId) {
    return null;
  }

  return (
    <Form className="form-horizontal" onSubmit={handleSubmit}>
      <EdgeGroupsSelector
        value={values.groupIds}
        onChange={(value) => setFieldValue('groupIds', value)}
        error={errors.groupIds}
      />

      {hasKubeEndpoint && hasDockerEndpoint && (
        <TextTip>
          There are no available deployment types when there is more than one
          type of environment in your edge group selection (e.g. Kubernetes and
          Docker environments). Please select edge groups that have environments
          of the same type.
        </TextTip>
      )}

      {values.deploymentType === DeploymentType.Compose && hasKubeEndpoint && (
        <FormError>
          Edge groups with kubernetes environments no longer support compose
          deployment types in Portainer. Please select edge groups that only
          have docker environments when using compose deployment types.
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

      <GitReferenceCard
        stackType="edge"
        autoUpdate={stack.AutoUpdate}
        gitConfig={stack.GitConfig}
        sourceId={stack.GitSourceId}
      />

      <FormSection title="Update from git repository">
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

      <FormSection title="Advanced configuration" isFoldable>
        <RefField
          value={values.refName}
          onChange={(value) => setFieldValue('refName', value)}
          sourceId={stack.GitSourceId}
          error={errors.refName}
        />

        <GitSourceSelector value={stack.GitSourceId} readOnly />
        <TextTip>
          Credentials are managed by the source.{' '}
          <Link
            to="portainer.gitops.sources.item"
            params={{ sourceId: stack.GitSourceId }}
            data-cy="source-item-link"
          >
            Edit source
          </Link>
        </TextTip>

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

      <FormSection title="Actions">
        <LoadingButton
          disabled={dirty || !isValid || isLoading}
          data-cy="pull-and-update-stack-button"
          isLoading={isUpdateVersion && isLoading}
          loadingText="updating stack..."
        >
          Pull and update stack
        </LoadingButton>

        <LoadingButton
          type="button"
          disabled={!dirty || !isValid || isLoading}
          isLoading={!isUpdateVersion && isLoading}
          loadingText="updating settings..."
          onClick={onUpdateSettingsClick}
          data-cy="edge-stack-update-settings-button"
        >
          Update settings
        </LoadingButton>
      </FormSection>
    </Form>
  );
}

function formValidation() {
  return object({
    groupIds: array()
      .of(number().required())
      .required()
      .min(1, 'At least one edge group is required'),
  });
}

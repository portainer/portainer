import { Form, useFormikContext } from 'formik';

import { applySetStateAction } from '@/react-tools/apply-set-state-action';
import { EnvironmentType } from '@/react/portainer/environments/types';
import { isBE } from '@/react/portainer/feature-flags/feature-flags.service';

import { EnvironmentVariablesPanel } from '@@/form-components/EnvironmentVariablesFieldset';
import { FormActions } from '@@/form-components/FormActions';

import { EdgeGroupsSelector } from '../components/EdgeGroupsSelector';
import { EdgeStackDeploymentTypeSelector } from '../components/EdgeStackDeploymentTypeSelector';
import { StaggerFieldset } from '../components/StaggerFieldset';
import { PrivateRegistryFieldsetWrapper } from '../ItemView/EditEdgeStackForm/PrivateRegistryFieldsetWrapper';
import { useEdgeGroupHasType } from '../ItemView/EditEdgeStackForm/useEdgeGroupHasType';
import { DeploymentType } from '../types';

import { DockerComposeForm } from './DockerComposeForm';
import { KubeFormValues, KubeManifestForm } from './KubeManifestForm';
import { NameField } from './NameField';
import { WebhookSwitch } from './WebhookSwitch';
import { FormValues } from './types';
import { DeploymentOptions } from './DeploymentOptions';

export function InnerForm({
  webhookId,
  isLoading,
  onChangeTemplate,
}: {
  webhookId: string;
  isLoading: boolean;
  onChangeTemplate: ({
    templateType,
    templateId,
  }: {
    templateType: 'app' | 'custom' | undefined;
    templateId: number | undefined;
  }) => void;
}) {
  const { values, setFieldValue, errors, setValues, setFieldError, isValid } =
    useFormikContext<FormValues>();
  const { hasType } = useEdgeGroupHasType(values.groupIds);

  const hasKubeEndpoint = hasType(EnvironmentType.EdgeAgentOnKubernetes);
  const hasDockerEndpoint = hasType(EnvironmentType.EdgeAgentOnDocker);
  const hasMultipleTypes = hasKubeEndpoint && hasDockerEndpoint;
  const multipleTypesError = hasMultipleTypes
    ? `There are no available deployment types when there is more than one
          type of environment in your edge group selection (e.g. Kubernetes and
          Docker environments). Please select edge groups that have environments
          of the same type.`
    : undefined;

  return (
    <Form className="form-horizontal" role="form">
      <NameField
        onChange={(value) => setFieldValue('name', value)}
        value={values.name}
        errors={errors.name}
        placeholder="e.g. my-stack"
      />

      <EdgeGroupsSelector
        value={values.groupIds}
        onChange={(value) => setFieldValue('groupIds', value)}
        error={errors.groupIds || multipleTypesError}
      />

      <EdgeStackDeploymentTypeSelector
        value={values.deploymentType}
        hasDockerEndpoint={hasDockerEndpoint}
        hasKubeEndpoint={hasKubeEndpoint}
        onChange={(value) => setFieldValue('deploymentType', value)}
        error={errors.deploymentType}
      />

      {values.deploymentType === DeploymentType.Compose && (
        <DockerComposeForm
          webhookId={webhookId}
          onChangeTemplate={onChangeTemplate}
        />
      )}

      {values.deploymentType === DeploymentType.Kubernetes && (
        <KubeManifestForm
          values={values as KubeFormValues}
          webhookId={webhookId}
          errors={errors}
          setValues={(kubeValues) =>
            setValues((values) => ({
              ...values,
              ...applySetStateAction(kubeValues, values as KubeFormValues),
            }))
          }
        />
      )}

      {isBE && (
        <>
          {values.method !== 'repository' && (
            <WebhookSwitch
              onChange={(value) => setFieldValue('enableWebhook', value)}
              value={values.enableWebhook}
            />
          )}

          {values.deploymentType === DeploymentType.Compose && (
            <EnvironmentVariablesPanel
              values={values.envVars}
              onChange={(value) => setFieldValue('envVars', value)}
            />
          )}

          <PrivateRegistryFieldsetWrapper
            onChange={(value) => setFieldValue('privateRegistryId', value)}
            value={values.privateRegistryId}
            values={{ fileContent: values.fileContent, file: values.file }}
            error={errors.privateRegistryId}
            onFieldError={(message) =>
              setFieldError('privateRegistryId', message)
            }
            isGit={values.method === 'repository'}
          />

          {values.deploymentType === DeploymentType.Compose && (
            <DeploymentOptions values={values} setFieldValue={setFieldValue} />
          )}

          <StaggerFieldset
            isEdit={false}
            values={values.staggerConfig}
            errors={errors.staggerConfig}
            onChange={(newStaggerValues) =>
              setFieldValue('staggerConfig', newStaggerValues)
            }
          />
        </>
      )}

      <FormActions
        data-cy="edgeStackCreate-createStackButton"
        submitLabel="Deploy the stack"
        loadingText="Deployment in progress..."
        isValid={isValid}
        isLoading={isLoading}
      />
    </Form>
  );
}

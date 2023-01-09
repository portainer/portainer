import { Form, Formik, useFormikContext } from 'formik';
import { useState } from 'react';
import { array, boolean, number, object, SchemaOf, string } from 'yup';

import { EdgeGroupsSelector } from '@/react/edge/edge-stacks/components/EdgeGroupsSelector';
import { EdgeStackDeploymentTypeSelector } from '@/react/edge/edge-stacks/components/EdgeStackDeploymentTypeSelector';
import { DeploymentType, EdgeStack } from '@/react/edge/edge-stacks/types';
import { EnvironmentType } from '@/react/portainer/environments/types';

import { FormSection } from '@@/form-components/FormSection';
import { TextTip } from '@@/Tip/TextTip';
import { SwitchField } from '@@/form-components/SwitchField';
import { LoadingButton } from '@@/buttons';

import { PrivateRegistryFieldsetWrapper } from './PrivateRegistryFieldsetWrapper';
import { FormValues } from './types';
import { ComposeForm } from './ComposeForm';
import { KubernetesForm } from './KubernetesForm';
import { NomadForm } from './NomadForm';
import { GitForm } from './GitForm';
import { useValidateEnvironmentTypes } from './useEdgeGroupHasType';
import { atLeastTwo } from './atLeastTwo';

interface Props {
  edgeStack: EdgeStack;
  isSubmitting: boolean;
  onSubmit: (values: FormValues) => void;
  onEditorChange: (content: string) => void;
  fileContent: string;
  allowKubeToSelectCompose: boolean;
}

const forms = {
  [DeploymentType.Compose]: ComposeForm,
  [DeploymentType.Kubernetes]: KubernetesForm,
  [DeploymentType.Nomad]: NomadForm,
};

export function EditEdgeStackForm({
  isSubmitting,
  edgeStack,
  onSubmit,
  onEditorChange,
  fileContent,
  allowKubeToSelectCompose,
}: Props) {
  if (edgeStack.GitConfig) {
    return <GitForm stack={edgeStack} />;
  }

  const formValues: FormValues = {
    edgeGroups: edgeStack.EdgeGroups,
    deploymentType: edgeStack.DeploymentType,
    privateRegistryId: edgeStack.Registries?.[0],
    content: fileContent,
    useManifestNamespaces: edgeStack.UseManifestNamespaces,
    prePullImage: edgeStack.PrePullImage,
    retryDeploy: edgeStack.RetryDeploy,
  };

  return (
    <Formik
      initialValues={formValues}
      onSubmit={onSubmit}
      validationSchema={formValidation()}
    >
      <InnerForm
        edgeStack={edgeStack}
        isSubmitting={isSubmitting}
        onEditorChange={onEditorChange}
        allowKubeToSelectCompose={allowKubeToSelectCompose}
      />
    </Formik>
  );
}

function InnerForm({
  onEditorChange,
  edgeStack,
  isSubmitting,
  allowKubeToSelectCompose,
}: {
  edgeStack: EdgeStack;
  isSubmitting: boolean;
  onEditorChange: (content: string) => void;
  allowKubeToSelectCompose: boolean;
}) {
  const {
    values,
    setFieldValue,
    isValid,

    errors,
    setFieldError,
  } = useFormikContext<FormValues>();
  const { getCachedContent, setContentCache } = useCachedContent();
  const { hasType } = useValidateEnvironmentTypes(values.edgeGroups);

  const hasKubeEndpoint = hasType(EnvironmentType.EdgeAgentOnKubernetes);
  const hasDockerEndpoint = hasType(EnvironmentType.EdgeAgentOnDocker);
  const hasNomadEndpoint = hasType(EnvironmentType.EdgeAgentOnNomad);

  const DeploymentForm = forms[values.deploymentType];

  return (
    <Form className="form-horizontal">
      <EdgeGroupsSelector
        value={values.edgeGroups}
        onChange={(value) => setFieldValue('edgeGroups', value)}
        error={errors.edgeGroups}
      />

      {atLeastTwo(hasKubeEndpoint, hasDockerEndpoint, hasNomadEndpoint) && (
        <TextTip>
          There are no available deployment types when there is more than one
          type of environment in your edge group selection (e.g. Kubernetes and
          Docker environments). Please select edge groups that have environments
          of the same type.
        </TextTip>
      )}

      {values.deploymentType === DeploymentType.Compose && hasKubeEndpoint && (
        <TextTip>
          Edge groups with kubernetes environments no longer support compose
          deployment types in Portainer. Please select edge groups that only
          have docker environments when using compose deployment types.
        </TextTip>
      )}

      <EdgeStackDeploymentTypeSelector
        allowKubeToSelectCompose={allowKubeToSelectCompose}
        value={values.deploymentType}
        hasDockerEndpoint={hasType(EnvironmentType.EdgeAgentOnDocker)}
        hasKubeEndpoint={hasType(EnvironmentType.EdgeAgentOnKubernetes)}
        hasNomadEndpoint={hasType(EnvironmentType.EdgeAgentOnNomad)}
        onChange={(value) => {
          setFieldValue('content', getCachedContent(value));
          setFieldValue('deploymentType', value);
        }}
      />

      <DeploymentForm
        hasKubeEndpoint={hasType(EnvironmentType.EdgeAgentOnKubernetes)}
        handleContentChange={handleContentChange}
      />

      <PrivateRegistryFieldsetWrapper
        value={values.privateRegistryId}
        onChange={(value) => setFieldValue('privateRegistryId', value)}
        isValid={isValid}
        values={values}
        stackName={edgeStack.Name}
        onFieldError={(error) => setFieldError('privateRegistryId', error)}
        error={errors.privateRegistryId}
      />

      {values.deploymentType === DeploymentType.Compose && (
        <>
          <SwitchField
            checked={values.prePullImage}
            name="prePullImage"
            label="Pre-pull images"
            tooltip="When enabled, redeployment will be executed when image(s) is pulled successfully"
            label-Class="col-sm-3 col-lg-2"
            onChange={(value) => setFieldValue('prePullImage', value)}
          />

          <SwitchField
            checked={values.retryDeploy}
            name="retryDeploy"
            label="Retry deployment"
            tooltip="When enabled, this will allow edge agent keep retrying deployment if failure occur"
            label-Class="col-sm-3 col-lg-2"
            onChange={(value) => setFieldValue('retryDeploy', value)}
          />
        </>
      )}

      <FormSection title="Actions">
        <div className="form-group">
          <div className="col-sm-12">
            <LoadingButton
              className="!ml-0"
              size="small"
              disabled={!isValid}
              isLoading={isSubmitting}
              button-spinner="$ctrl.actionInProgress"
              loadingText="Update in progress..."
            >
              Update the stack
            </LoadingButton>
          </div>
        </div>
      </FormSection>
    </Form>
  );

  function handleContentChange(type: DeploymentType, content: string) {
    setFieldValue('content', content);
    setContentCache(type, content);
    onEditorChange(content);
  }
}

function useCachedContent() {
  const [cachedContent, setCachedContent] = useState({
    [DeploymentType.Compose]: '',
    [DeploymentType.Kubernetes]: '',
    [DeploymentType.Nomad]: '',
  });

  function handleChangeContent(type: DeploymentType, content: string) {
    setCachedContent((cache) => ({ ...cache, [type]: content }));
  }

  return {
    setContentCache: handleChangeContent,
    getCachedContent: (type: DeploymentType) => cachedContent[type],
  };
}

function formValidation(): SchemaOf<FormValues> {
  return object({
    content: string().required('Content is required'),
    deploymentType: number()
      .oneOf([0, 1, 2])
      .required('Deployment type is required'),
    privateRegistryId: number().optional(),
    prePullImage: boolean().default(false),
    retryDeploy: boolean().default(false),
    useManifestNamespaces: boolean().default(false),
    edgeGroups: array()
      .of(number().required())
      .required()
      .min(1, 'At least one edge group is required'),
  });
}

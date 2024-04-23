import { Formik } from 'formik';
import { useRouter } from '@uirouter/react';

import { StackType } from '@/react/common/stacks/types';
import { notifySuccess } from '@/portainer/services/notifications';
import { useCreateTemplateMutation } from '@/react/portainer/templates/custom-templates/queries/useCreateTemplateMutation';
import { EnvironmentId } from '@/react/portainer/environments/types';
import { useEnvironmentDeploymentOptions } from '@/react/portainer/environments/queries/useEnvironment';
import { useCurrentEnvironment } from '@/react/hooks/useCurrentEnvironment';
import { isKubernetesEnvironment } from '@/react/portainer/environments/utils';
import { DeployMethod } from '@/react/portainer/gitops/types';

import { useInitialValues } from './useInitialValues';
import { FormValues, initialBuildMethods } from './types';
import { useValidation } from './useValidation';
import { InnerForm } from './InnerForm';

export function CreateForm({
  environmentId,
  viewType,
  defaultType,
}: {
  environmentId?: EnvironmentId;
  viewType: 'kube' | 'docker' | 'edge';
  defaultType: StackType;
}) {
  const deployMethod: DeployMethod =
    defaultType === StackType.Kubernetes ? 'manifest' : 'compose';
  const isEdge = !environmentId;
  const router = useRouter();
  const mutation = useCreateTemplateMutation();
  const validation = useValidation({ viewType, deployMethod });
  const buildMethods = useBuildMethods();

  const initialValues = useInitialValues({
    defaultType,
    isEdge,
    buildMethods: buildMethods.map((method) => method.value),
  });

  if (!initialValues) {
    return null;
  }

  return (
    <Formik
      initialValues={initialValues}
      onSubmit={handleSubmit}
      validationSchema={validation}
      validateOnMount
    >
      <InnerForm
        isLoading={mutation.isLoading}
        environmentId={environmentId}
        buildMethods={buildMethods}
      />
    </Formik>
  );

  function handleSubmit(values: FormValues) {
    mutation.mutate(
      {
        ...values,
        EdgeTemplate: isEdge,
      },
      {
        onSuccess() {
          notifySuccess('Success', 'Template created');
          router.stateService.go('^');
        },
      }
    );
  }
}

function useBuildMethods() {
  const environment = useCurrentEnvironment(false);

  const deploymentOptionsQuery = useEnvironmentDeploymentOptions(
    environment.data && isKubernetesEnvironment(environment.data.Type)
      ? environment.data.Id
      : undefined
  );
  return initialBuildMethods.filter((method) => {
    switch (method.value) {
      case 'editor':
        return !deploymentOptionsQuery.data?.hideWebEditor;
      case 'upload':
        return !deploymentOptionsQuery.data?.hideFileUpload;
      case 'repository':
        return true;
      default:
        return true;
    }
  });
}

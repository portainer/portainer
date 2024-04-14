import { FormikHelpers } from 'formik';
import { StorageClass } from 'kubernetes-types/storage/v1';
import { compare } from 'fast-json-patch';
import { UseMutationResult } from '@tanstack/react-query';

import { notifyError, notifySuccess } from '@/portainer/services/notifications';
import { UpdateEnvironmentPayload } from '@/react/portainer/environments/queries/useUpdateEnvironmentMutation';
import { Environment } from '@/react/portainer/environments/types';
import { TrackEventProps } from '@/angulartics.matomo/analytics-services';

import { ConfigureFormValues, StorageClassFormValues } from './types';
import { ConfigureClusterPayloads } from './useConfigureClusterMutation';

// handle the form submission
export async function handleSubmitConfigureCluster(
  values: ConfigureFormValues,
  initialValues: ConfigureFormValues | undefined,
  configureClusterMutation: UseMutationResult<
    void,
    unknown,
    ConfigureClusterPayloads,
    unknown
  >,
  { resetForm }: FormikHelpers<ConfigureFormValues>,
  trackEvent: (action: string, properties: TrackEventProps) => void,
  environment?: Environment
) {
  if (!environment) {
    notifyError('Unable to save configuration: environment not found');
    return;
  }

  // send metrics if needed
  if (
    values.restrictDefaultNamespace &&
    !initialValues?.restrictDefaultNamespace
  ) {
    trackEvent('kubernetes-configure', {
      category: 'kubernetes',
      metadata: {
        restrictAccessToDefaultNamespace: values.restrictDefaultNamespace,
      },
    });
  }

  // transform the form values into the environment object
  const selectedStorageClasses = values.storageClasses.filter(
    (storageClass) => storageClass.selected
  );
  const updatedEnvironment = assignFormValuesToEnvironment(
    environment,
    values,
    selectedStorageClasses
  );
  const storageClassPatches = createStorageClassPatches(
    selectedStorageClasses,
    initialValues?.storageClasses
  );

  // update the environment using a react query mutation
  await configureClusterMutation.mutateAsync(
    {
      id: environment.Id,
      updateEnvironmentPayload: updatedEnvironment,
      initialIngressControllers: initialValues?.ingressClasses ?? [],
      ingressControllers: values.ingressClasses,
      storageClassPatches,
    },
    {
      onSuccess: () => {
        notifySuccess('Success', 'Configuration successfully applied');
        resetForm();
      },
    }
  );
}

function createStorageClassPatches(
  storageClasses: StorageClassFormValues[],
  oldStorageClasses?: StorageClassFormValues[]
) {
  const storageClassPatches = storageClasses.flatMap((storageClass) => {
    const oldStorageClass = oldStorageClasses?.find(
      (sc) => sc.Name === storageClass.Name
    );
    if (!oldStorageClass) {
      return [];
    }
    const newPayload = createStorageClassPayload(storageClass);
    const oldPayload = createStorageClassPayload(oldStorageClass);
    const patch = compare(oldPayload, newPayload);
    return [{ name: storageClass.Name, patch }];
  });
  return storageClassPatches;
}

function createStorageClassPayload(storageClass: StorageClassFormValues) {
  const payload: StorageClass = {
    provisioner: storageClass.Provisioner,
    allowVolumeExpansion: storageClass.AllowVolumeExpansion,
    metadata: {
      uid: '',
      name: storageClass.Name,
      namespace: '',
      labels: {},
      annotations: {},
    },
  };
  return payload;
}

function assignFormValuesToEnvironment(
  environment: Environment,
  values: ConfigureFormValues,
  selectedStorageClasses: StorageClassFormValues[]
) {
  // note that the ingress datatable form values are omitted and included in another call
  const updatedEnvironment: Partial<UpdateEnvironmentPayload> = {
    Kubernetes: {
      ...environment.Kubernetes,
      Configuration: {
        ...environment.Kubernetes.Configuration,
        UseLoadBalancer: values.useLoadBalancer,
        UseServerMetrics: values.useServerMetrics,
        EnableResourceOverCommit: values.enableResourceOverCommit,
        ResourceOverCommitPercentage: values.resourceOverCommitPercentage,
        RestrictDefaultNamespace: values.restrictDefaultNamespace,
        RestrictStandardUserIngressW: values.restrictStandardUserIngressW,
        IngressAvailabilityPerNamespace: values.ingressAvailabilityPerNamespace,
        AllowNoneIngressClass: values.allowNoneIngressClass,
        StorageClasses: selectedStorageClasses.map((storageClass) => ({
          Name: storageClass.Name,
          AccessModes: storageClass.AccessModes.map(
            (accessMode) => accessMode.Name
          ),
          AllowVolumeExpansion: storageClass.AllowVolumeExpansion,
          Provisioner: storageClass.Provisioner,
        })),
      },
    },
  };
  return updatedEnvironment;
}

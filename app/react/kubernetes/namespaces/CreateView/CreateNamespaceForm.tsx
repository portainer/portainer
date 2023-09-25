import { Formik } from 'formik';
import { useRouter } from '@uirouter/react';

import { useEnvironmentId } from '@/react/hooks/useEnvironmentId';
import { notifySuccess } from '@/portainer/services/notifications';
import { useCurrentEnvironment } from '@/react/hooks/useCurrentEnvironment';
import { useEnvironmentRegistries } from '@/react/portainer/environments/queries/useEnvironmentRegistries';

import { Widget, WidgetBody } from '@@/Widget';

import { useIngressControllerClassMapQuery } from '../../cluster/ingressClass/useIngressControllerClassMap';
import { NamespaceInnerForm } from '../components/NamespaceInnerForm';

import {
  CreateNamespaceFormValues,
  CreateNamespacePayload,
  UpdateRegistryPayload,
} from './types';
import { useCreateNamespaceMutation, useResourceLimits } from './queries';
import { getNamespaceValidationSchema } from './CreateNamespaceForm.validation';
import { transformFormValuesToNamespacePayload } from './utils';

export function CreateNamespaceForm() {
  const router = useRouter();
  const environmentId = useEnvironmentId();
  const { data: environment, ...environmentQuery } = useCurrentEnvironment();
  const resourceLimitsQuery = useResourceLimits(environmentId);
  const { data: registries } = useEnvironmentRegistries(environmentId, {
    hideDefault: true,
  });
  // for namespace create, show ingress classes that are allowed in the current environment.
  // the ingressClasses show the none option, so we don't need to add it here.
  const { data: ingressClasses } = useIngressControllerClassMapQuery({
    environmentId,
    allowedOnly: true,
  });

  const createNamespaceMutation = useCreateNamespaceMutation(environmentId);

  if (resourceLimitsQuery.isLoading || environmentQuery.isLoading) {
    return null;
  }

  const memoryLimit = resourceLimitsQuery.data?.Memory ?? 0;

  const initialValues: CreateNamespaceFormValues = {
    name: '',
    ingressClasses: ingressClasses ?? [],
    resourceQuota: {
      enabled: false,
      memory: '0',
      cpu: '0',
    },
    registries: [],
  };

  return (
    <Widget>
      <WidgetBody>
        <Formik
          enableReinitialize
          initialValues={initialValues}
          onSubmit={handleSubmit}
          validateOnMount
          validationSchema={getNamespaceValidationSchema(memoryLimit)}
        >
          {NamespaceInnerForm}
        </Formik>
      </WidgetBody>
    </Widget>
  );

  function handleSubmit(values: CreateNamespaceFormValues) {
    const createNamespacePayload: CreateNamespacePayload =
      transformFormValuesToNamespacePayload(values);
    const updateRegistriesPayload: UpdateRegistryPayload[] =
      values.registries.flatMap((registryFormValues) => {
        // find the matching registry from the cluster registries
        const selectedRegistry = registries?.find(
          (registry) => registryFormValues.Id === registry.Id
        );
        if (!selectedRegistry) {
          return [];
        }
        const envNamespacesWithAccess =
          selectedRegistry.RegistryAccesses[`${environmentId}`]?.Namespaces ||
          [];
        return {
          Id: selectedRegistry.Id,
          Namespaces: [...envNamespacesWithAccess, values.name],
        };
      });

    createNamespaceMutation.mutate(
      {
        createNamespacePayload,
        updateRegistriesPayload,
        namespaceIngressControllerPayload: values.ingressClasses,
      },
      {
        onSuccess: () => {
          notifySuccess(
            'Success',
            `Namespace '${values.name}' created successfully`
          );
          router.stateService.go('kubernetes.resourcePools');
        },
      }
    );
  }
}

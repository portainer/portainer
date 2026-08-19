import { Formik } from 'formik';
import { useCurrentStateAndParams, useRouter } from '@uirouter/react';

import { useEnvironmentId } from '@/react/hooks/useEnvironmentId';
import { notifySuccess } from '@/portainer/services/notifications';
import { useCurrentEnvironment } from '@/react/hooks/useCurrentEnvironment';
import { useEnvironmentRegistries } from '@/react/portainer/environments/queries/useEnvironmentRegistries';
import { useCurrentUser } from '@/react/hooks/useUser';

import { Loading, Widget, WidgetBody } from '@@/Widget';
import { Alert } from '@@/Alert';

import { NamespaceInnerForm } from '../components/NamespaceForm/NamespaceInnerForm';
import { useNamespacesQuery } from '../queries/useNamespacesQuery';
import { useClusterResourceLimitsQuery } from '../queries/useResourceLimitsQuery';
import { NamespaceFormValues, NamespacePayload } from '../types';
import { getNamespaceValidationSchema } from '../components/NamespaceForm/NamespaceForm.validation';
import { transformFormValuesToNamespacePayload } from '../components/NamespaceForm/utils';
import { useNamespaceQuery } from '../queries/useNamespaceQuery';
import { useIngressControllerClassMapQuery } from '../../cluster/ingressClass/useIngressControllerClassMap';
import { useUpdateNamespaceMutation } from '../queries/useUpdateNamespaceMutation';

import { useNamespaceFormValues } from './useNamespaceFormValues';
import { confirmUpdateNamespace } from './ConfirmUpdateNamespace';
import { createUpdateRegistriesPayload } from './createUpdateRegistriesPayload';
import {
  hasResourceQuotaBeenReduced,
  hasNamespaceAccessBeenRemoved,
  hasIngressClassesBeenRemoved,
} from './updateNamespaceWarnings';

export function UpdateNamespaceForm() {
  const {
    params: { id: namespaceName },
  } = useCurrentStateAndParams();
  const router = useRouter();

  // for initial values
  const { user } = useCurrentUser();
  const environmentId = useEnvironmentId();
  const environmentQuery = useCurrentEnvironment();
  const namespacesQuery = useNamespacesQuery(environmentId);
  const resourceLimitsQuery = useClusterResourceLimitsQuery(environmentId);
  const namespaceQuery = useNamespaceQuery(environmentId, namespaceName, {
    params: { withResourceQuota: 'true' },
  });
  const registriesQuery = useEnvironmentRegistries(environmentId, {
    hideDefault: true,
  });
  const ingressClassesQuery = useIngressControllerClassMapQuery({
    environmentId,
    namespace: namespaceName,
    allowedOnly: true,
  });
  const storageClasses =
    environmentQuery.data?.Kubernetes.Configuration.StorageClasses;
  const { data: namespaces } = namespacesQuery;
  const { data: resourceLimits } = resourceLimitsQuery;
  const { data: namespace } = namespaceQuery;
  const { data: registries } = registriesQuery;
  const { data: ingressClasses } = ingressClassesQuery;

  const updateNamespaceMutation = useUpdateNamespaceMutation(environmentId);

  const namespaceNames = Object.keys(namespaces || {});
  const memoryLimit = resourceLimits?.Memory ?? 0;
  const cpuLimit = resourceLimits?.CPU ?? 0;
  const initialValues = useNamespaceFormValues({
    namespaceName,
    environmentId,
    storageClasses,
    namespace,
    registries,
    ingressClasses,
  });
  const isQueryLoading =
    environmentQuery.isLoading ||
    resourceLimitsQuery.isLoading ||
    namespacesQuery.isLoading ||
    namespaceQuery.isLoading ||
    registriesQuery.isLoading ||
    ingressClassesQuery.isLoading;

  const isQueryError =
    environmentQuery.isError ||
    resourceLimitsQuery.isError ||
    namespacesQuery.isError ||
    namespaceQuery.isError ||
    registriesQuery.isError ||
    ingressClassesQuery.isError;

  if (isQueryLoading) {
    return <Loading />;
  }

  if (isQueryError) {
    return (
      <Alert color="error" title="Error">
        Error loading namespace
      </Alert>
    );
  }

  if (!initialValues) {
    return (
      <Alert color="warn" title="Warning">
        No data found for namespace
      </Alert>
    );
  }

  return (
    <div className="row">
      <div className="col-sm-12">
        <Widget>
          <WidgetBody>
            <Formik
              initialValues={initialValues}
              onSubmit={(values) => handleSubmit(values, user.Username)}
              validateOnMount
              validationSchema={getNamespaceValidationSchema(
                memoryLimit,
                cpuLimit,
                namespaceNames
              )}
            >
              {(formikProps) => (
                <NamespaceInnerForm
                  // eslint-disable-next-line react/jsx-props-no-spreading
                  {...formikProps}
                  isEdit
                  isUpdating={updateNamespaceMutation.isLoading}
                />
              )}
            </Formik>
          </WidgetBody>
        </Widget>
      </div>
    </div>
  );

  async function handleSubmit(values: NamespaceFormValues, userName: string) {
    const createNamespacePayload: NamespacePayload =
      transformFormValuesToNamespacePayload(values, userName);
    const updateRegistriesPayload = createUpdateRegistriesPayload({
      registries,
      namespaceName,
      newRegistriesValues: values.registries,
      initialRegistriesValues: initialValues?.registries || [],
      environmentId,
    });

    // give update warnings if needed
    const isNamespaceAccessRemoved = hasNamespaceAccessBeenRemoved(
      values.registries,
      initialValues?.registries || [],
      environmentId,
      values.name
    );
    const isIngressClassesRemoved = hasIngressClassesBeenRemoved(
      values.ingressClasses,
      initialValues?.ingressClasses || []
    );
    const warnings = {
      quota: hasResourceQuotaBeenReduced(
        values.resourceQuota,
        initialValues?.resourceQuota
      ),
      ingress: isIngressClassesRemoved,
      registries: isNamespaceAccessRemoved,
    };
    if (Object.values(warnings).some(Boolean)) {
      const confirmed = await confirmUpdateNamespace(warnings);
      if (!confirmed) {
        return;
      }
    }

    // update the namespace
    updateNamespaceMutation.mutate(
      {
        createNamespacePayload,
        updateRegistriesPayload,
        namespaceIngressControllerPayload: values.ingressClasses,
      },
      {
        onSuccess: () => {
          notifySuccess(
            'Success',
            `Namespace '${values.name}' updated successfully`
          );
          router.stateService.reload();
        },
      }
    );
  }
}

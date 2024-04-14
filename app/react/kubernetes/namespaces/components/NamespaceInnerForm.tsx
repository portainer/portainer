import { Field, Form, FormikProps } from 'formik';
import { MultiValue } from 'react-select';

import { useEnvironmentId } from '@/react/hooks/useEnvironmentId';
import { useCurrentEnvironment } from '@/react/hooks/useCurrentEnvironment';
import { Registry } from '@/react/portainer/registries/types/registry';

import { FormControl } from '@@/form-components/FormControl';
import { FormSection } from '@@/form-components/FormSection';
import { Input } from '@@/form-components/Input';
import { FormActions } from '@@/form-components/FormActions';

import { IngressClassDatatable } from '../../cluster/ingressClass/IngressClassDatatable';
import { useIngressControllerClassMapQuery } from '../../cluster/ingressClass/useIngressControllerClassMap';
import { CreateNamespaceFormValues } from '../CreateView/types';
import { AnnotationsBeTeaser } from '../../annotations/AnnotationsBeTeaser';

import { LoadBalancerFormSection } from './LoadBalancerFormSection';
import { NamespaceSummary } from './NamespaceSummary';
import { StorageQuotaFormSection } from './StorageQuotaFormSection/StorageQuotaFormSection';
import { ResourceQuotaFormSection } from './ResourceQuotaFormSection';
import { RegistriesFormSection } from './RegistriesFormSection';
import { ResourceQuotaFormValues } from './ResourceQuotaFormSection/types';

export function NamespaceInnerForm({
  errors,
  isValid,
  setFieldValue,
  values,
  isSubmitting,
  initialValues,
}: FormikProps<CreateNamespaceFormValues>) {
  const environmentId = useEnvironmentId();
  const environmentQuery = useCurrentEnvironment();
  const ingressClassesQuery = useIngressControllerClassMapQuery({
    environmentId,
    allowedOnly: true,
  });

  if (environmentQuery.isLoading) {
    return null;
  }

  const useLoadBalancer =
    environmentQuery.data?.Kubernetes.Configuration.UseLoadBalancer;
  const enableResourceOverCommit =
    environmentQuery.data?.Kubernetes.Configuration.EnableResourceOverCommit;
  const enableIngressControllersPerNamespace =
    environmentQuery.data?.Kubernetes.Configuration
      .IngressAvailabilityPerNamespace;
  const storageClasses =
    environmentQuery.data?.Kubernetes.Configuration.StorageClasses ?? [];

  return (
    <Form>
      <FormControl
        inputId="namespace"
        label="Name"
        required
        errors={errors.name}
      >
        <Field
          as={Input}
          id="namespace"
          name="name"
          placeholder="e.g. my-namespace"
          data-cy="k8sNamespaceCreate-namespaceNameInput"
        />
      </FormControl>
      <AnnotationsBeTeaser />
      <ResourceQuotaFormSection
        enableResourceOverCommit={enableResourceOverCommit}
        values={values.resourceQuota}
        onChange={(resourceQuota: ResourceQuotaFormValues) =>
          setFieldValue('resourceQuota', resourceQuota)
        }
        errors={errors.resourceQuota}
      />
      {useLoadBalancer && <LoadBalancerFormSection />}
      {enableIngressControllersPerNamespace && (
        <FormSection title="Networking">
          <IngressClassDatatable
            onChange={(classes) => setFieldValue('ingressClasses', classes)}
            values={values.ingressClasses}
            description="Enable the ingress controllers that users can select when publishing applications in this namespace."
            noIngressControllerLabel="No ingress controllers available in the cluster. Go to the cluster setup view to configure and allow the use of ingress controllers in the cluster."
            view="namespace"
            isLoading={ingressClassesQuery.isLoading}
            initialValues={initialValues.ingressClasses}
          />
        </FormSection>
      )}
      <RegistriesFormSection
        values={values.registries}
        onChange={(registries: MultiValue<Registry>) =>
          setFieldValue('registries', registries)
        }
        errors={errors.registries}
      />
      {storageClasses.length > 0 && <StorageQuotaFormSection />}
      <NamespaceSummary
        initialValues={initialValues}
        values={values}
        isValid={isValid}
      />
      <FormActions
        submitLabel="Create namespace"
        loadingText="Creating namespace"
        isLoading={isSubmitting}
        isValid={isValid}
        data-cy="k8sNamespaceCreate-submitButton"
      />
    </Form>
  );
}

import { useEffect, useMemo, useState } from 'react';
import { FormikErrors } from 'formik';

import { KubernetesApplicationPublishingTypes } from '@/kubernetes/models/application/models';
import { useEnvironmentId } from '@/react/hooks/useEnvironmentId';
import {
  useIngressControllers,
  useIngresses,
} from '@/react/kubernetes/ingresses/queries';

import { FormSection } from '@@/form-components/FormSection';

import {
  ServiceFormValues,
  ServiceTypeAngularEnum,
  ServiceTypeOption,
  ServiceTypeValue,
} from './types';
import { generateUniqueName } from './utils';
import { ClusterIpServicesForm } from './cluster-ip/ClusterIpServicesForm';
import { ServiceTabs } from './components/ServiceTabs';
import { NodePortServicesForm } from './node-port/NodePortServicesForm';
import { LoadBalancerServicesForm } from './load-balancer/LoadBalancerServicesForm';
import { ServiceTabLabel } from './components/ServiceTabLabel';
import { PublishingExplaination } from './PublishingExplaination';

const serviceTypeEnumsToValues: Record<
  ServiceTypeAngularEnum,
  ServiceTypeValue
> = {
  [KubernetesApplicationPublishingTypes.CLUSTER_IP]: 'ClusterIP',
  [KubernetesApplicationPublishingTypes.NODE_PORT]: 'NodePort',
  [KubernetesApplicationPublishingTypes.LOAD_BALANCER]: 'LoadBalancer',
};

interface Props {
  values: ServiceFormValues[];
  onChange: (services: ServiceFormValues[]) => void;
  errors?: FormikErrors<ServiceFormValues[]>;
  appName: string;
  selector: Record<string, string>;
  isEditMode: boolean;
  namespace?: string;
}

export function KubeServicesForm({
  values: services,
  onChange,
  errors,
  appName,
  selector,
  isEditMode,
  namespace,
}: Props) {
  const [selectedServiceType, setSelectedServiceType] =
    useState<ServiceTypeValue>('ClusterIP');

  // start loading ingresses and controllers early to reduce perceived loading time
  const environmentId = useEnvironmentId();
  useIngresses(environmentId, namespace ? [namespace] : []);
  useIngressControllers(environmentId, namespace);

  // when the appName changes, update the names for each service
  // and the serviceNames for each service port
  const newServiceNames = useMemo(
    () => getUniqNames(appName, services),
    [appName, services]
  );
  useEffect(() => {
    if (!isEditMode) {
      const newServices = services.map((service, index) => {
        const newServiceName = newServiceNames[index];
        const newServicePorts = service.Ports.map((port) => ({
          ...port,
          serviceName: newServiceName,
        }));
        return { ...service, Name: newServiceName, Ports: newServicePorts };
      });
      onChange(newServices);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appName]);

  const serviceTypeCounts = useMemo(
    () => getServiceTypeCounts(services),
    [services]
  );

  const serviceTypeHasErrors = useMemo(
    () => getServiceTypeHasErrors(services, errors),
    [services, errors]
  );

  const serviceTypeOptions: ServiceTypeOption[] = [
    {
      value: 'ClusterIP',
      label: (
        <ServiceTabLabel
          serviceTypeLabel="ClusterIP services"
          serviceTypeCount={serviceTypeCounts.ClusterIP}
          serviceTypeHasErrors={serviceTypeHasErrors.ClusterIP}
        />
      ),
    },
    {
      value: 'NodePort',
      label: (
        <ServiceTabLabel
          serviceTypeLabel="NodePort services"
          serviceTypeCount={serviceTypeCounts.NodePort}
          serviceTypeHasErrors={serviceTypeHasErrors.NodePort}
        />
      ),
    },
    {
      value: 'LoadBalancer',
      label: (
        <ServiceTabLabel
          serviceTypeLabel="LoadBalancer services"
          serviceTypeCount={serviceTypeCounts.LoadBalancer}
          serviceTypeHasErrors={serviceTypeHasErrors.LoadBalancer}
        />
      ),
    },
  ];

  return (
    <div className="flex flex-col">
      <FormSection title="Publishing the application" />
      <PublishingExplaination />
      <ServiceTabs
        serviceTypeOptions={serviceTypeOptions}
        selectedServiceType={selectedServiceType}
        setSelectedServiceType={setSelectedServiceType}
      />
      {selectedServiceType === 'ClusterIP' && (
        <ClusterIpServicesForm
          services={services}
          onChangeService={onChange}
          errors={errors}
          appName={appName}
          selector={selector}
          namespace={namespace}
          isEditMode={isEditMode}
        />
      )}
      {selectedServiceType === 'NodePort' && (
        <NodePortServicesForm
          services={services}
          onChangeService={onChange}
          errors={errors}
          appName={appName}
          selector={selector}
          namespace={namespace}
          isEditMode={isEditMode}
        />
      )}
      {selectedServiceType === 'LoadBalancer' && (
        <LoadBalancerServicesForm
          services={services}
          onChangeService={onChange}
          errors={errors}
          appName={appName}
          selector={selector}
          namespace={namespace}
          isEditMode={isEditMode}
        />
      )}
    </div>
  );
}

function getUniqNames(appName: string, services: ServiceFormValues[]) {
  const sortedServices = [...services].sort((a, b) =>
    a.Name && b.Name ? a.Name.localeCompare(b.Name) : 0
  );

  const uniqueNames = sortedServices.reduce(
    (acc: string[]) => {
      const newIndex =
        acc.findIndex((existingName) => existingName === appName) + 1;
      const uniqName = acc.includes(appName)
        ? generateUniqueName(appName, newIndex, services)
        : appName;
      return [...acc, uniqName];
    },
    [appName]
  );

  return uniqueNames;
}

/**
 * getServiceTypeCounts returns a map of service types to the number of services of that type
 */
function getServiceTypeCounts(
  services: ServiceFormValues[]
): Record<ServiceTypeValue, number> {
  return services.reduce((acc, service) => {
    const type = serviceTypeEnumsToValues[service.Type];
    const count = acc[type];
    return {
      ...acc,
      [type]: count ? count + 1 : 1,
    };
  }, {} as Record<ServiceTypeValue, number>);
}

/**
 * getServiceTypeHasErrors returns a map of service types to whether or not they have errors
 */
function getServiceTypeHasErrors(
  services: ServiceFormValues[],
  errors: FormikErrors<ServiceFormValues[] | undefined>
): Record<ServiceTypeValue, boolean> {
  return services.reduce((acc, service, index) => {
    const type = serviceTypeEnumsToValues[service.Type];
    const serviceHasErrors = !!errors?.[index];
    // if the service type already has an error, don't overwrite it
    if (acc[type] === true) return acc;
    // otherwise, set the error to the value of serviceHasErrors
    return {
      ...acc,
      [type]: serviceHasErrors,
    };
  }, {} as Record<ServiceTypeValue, boolean>);
}

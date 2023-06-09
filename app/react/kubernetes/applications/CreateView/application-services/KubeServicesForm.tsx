import { SchemaOf, array, boolean, mixed, number, object, string } from 'yup';
import { useEffect, useMemo, useState } from 'react';
import { FormikErrors } from 'formik';

import { KubernetesApplicationPublishingTypes } from '@/kubernetes/models/application/models';

import { Badge } from '@@/Badge';

import {
  ServiceFormValues,
  ServicePort,
  ServiceTypeAngularEnum,
  ServiceTypeOption,
  ServiceTypeValue,
} from './types';
import { generateUniqueName } from './utils';
import { ClusterIpServicesForm } from './ClusterIpServicesForm';
import { ServiceTabs } from './ServiceTabs';
import { NodePortServicesForm } from './NodePortServicesForm';
import { LoadBalancerServicesForm } from './LoadBalancerServicesForm';

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
}

export function KubeServicesForm({
  values: services,
  onChange,
  errors,
  appName,
  selector,
  isEditMode,
}: Props) {
  const [selectedServiceType, setSelectedServiceType] =
    useState<ServiceTypeValue>('ClusterIP');

  // when the appName changes, update the names for each service
  // and the serviceNames for each service port
  useEffect(() => {
    if (!isEditMode) {
      const newServiceNames = getUniqNames(appName, services);
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
  const serviceTypeOptions: ServiceTypeOption[] = [
    {
      value: 'ClusterIP',
      label: (
        <div className="inline-flex items-center">
          ClusterIP services
          {serviceTypeCounts.ClusterIP && (
            <Badge className="ml-2 flex-none">
              {serviceTypeCounts.ClusterIP}
            </Badge>
          )}
        </div>
      ),
    },
    {
      value: 'NodePort',
      label: (
        <div className="inline-flex items-center">
          NodePort services
          {serviceTypeCounts.NodePort && (
            <Badge className="ml-2 flex-none">
              {serviceTypeCounts.NodePort}
            </Badge>
          )}
        </div>
      ),
    },
    {
      value: 'LoadBalancer',
      label: (
        <div className="inline-flex items-center">
          LoadBalancer services
          {serviceTypeCounts.LoadBalancer && (
            <Badge className="ml-2 flex-none">
              {serviceTypeCounts.LoadBalancer}
            </Badge>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="flex flex-col">
      <div className="col-sm-12 form-section-title">
        Publishing the application
      </div>
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
        />
      )}
      {selectedServiceType === 'NodePort' && (
        <NodePortServicesForm
          services={services}
          onChangeService={onChange}
          errors={errors}
          appName={appName}
          selector={selector}
        />
      )}
      {selectedServiceType === 'LoadBalancer' && (
        <LoadBalancerServicesForm
          services={services}
          onChangeService={onChange}
          errors={errors}
          appName={appName}
          selector={selector}
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

// values returned from the angular parent component (pascal case instead of camel case keys),
// these should match the form values, but don't. Future tech debt work to update this would be nice
// to make the converted values and formValues objects to be the same
interface NodePortValues {
  Port: number;
  TargetPort: number;
  NodePort: number;
  Name?: string;
  Protocol?: string;
  Ingress?: string;
}

type ServiceValues = {
  Type: number;
  Name: string;
  Ports: NodePortValues[];
};

type NodePortValidationContext = {
  nodePortServices: ServiceValues[];
  formServices: ServiceFormValues[];
};

export function kubeServicesValidation(
  validationData?: NodePortValidationContext
): SchemaOf<ServiceFormValues[]> {
  return array(
    object({
      Headless: boolean().required(),
      Namespace: string(),
      Name: string(),
      StackName: string(),
      Type: mixed().oneOf([
        KubernetesApplicationPublishingTypes.CLUSTER_IP,
        KubernetesApplicationPublishingTypes.NODE_PORT,
        KubernetesApplicationPublishingTypes.LOAD_BALANCER,
      ]),
      ClusterIP: string(),
      ApplicationName: string(),
      ApplicationOwner: string(),
      Note: string(),
      Ingress: boolean().required(),
      Selector: object(),
      Ports: array(
        object({
          port: number()
            .required('Service port number is required.')
            .min(1, 'Service port number must be inside the range 1-65535.')
            .max(65535, 'Service port number must be inside the range 1-65535.')
            .test(
              'service-port-is-unique',
              'Service port number must be unique.',
              (servicePort, context) => {
                // test for duplicate service ports within this service.
                // yup gives access to context.parent which gives one ServicePort object.
                // yup also gives access to all form values through this.options.context.
                // Unfortunately, it doesn't give direct access to all Ports within the current service.
                // To find all ports in the service for validation, I'm filtering the services by the service name,
                // that's stored in the ServicePort object, then getting all Ports in the service.
                if (servicePort === undefined || validationData === undefined) {
                  return true;
                }
                const { formServices } = validationData;
                const matchingService = getServiceForPort(
                  context.parent as ServicePort,
                  formServices
                );
                if (matchingService === undefined) {
                  return true;
                }
                const servicePorts = matchingService.Ports;
                const duplicateServicePortCount = servicePorts.filter(
                  (port) => port.port === servicePort
                ).length;
                return duplicateServicePortCount <= 1;
              }
            ),
          targetPort: number()
            .required('Container port number is required.')
            .min(1, 'Container port number must be inside the range 1-65535.')
            .max(
              65535,
              'Container port number must be inside the range 1-65535.'
            ),
          name: string(),
          serviceName: string().required(),
          protocol: string(),
          nodePort: number()
            .test(
              'node-port-is-unique-in-service',
              'Node port is already used in this service.',
              (nodePort, context) => {
                if (nodePort === undefined || validationData === undefined) {
                  return true;
                }
                const { formServices } = validationData;
                const matchingService = getServiceForPort(
                  context.parent as ServicePort,
                  formServices
                );
                if (
                  matchingService === undefined ||
                  matchingService.Type !==
                    KubernetesApplicationPublishingTypes.NODE_PORT // ignore validation unless the service is of type nodeport
                ) {
                  return true;
                }
                const servicePorts = matchingService.Ports;
                const duplicateNodePortCount = servicePorts.filter(
                  (port) => port.nodePort === nodePort
                ).length;
                return duplicateNodePortCount <= 1;
              }
            )
            .test(
              'node-port-is-unique-in-cluster',
              'Node port is already used.',
              (nodePort, context) => {
                if (nodePort === undefined || validationData === undefined) {
                  return true;
                }
                const { formServices, nodePortServices } = validationData;
                const matchingService = getServiceForPort(
                  context.parent as ServicePort,
                  formServices
                );

                if (
                  matchingService === undefined ||
                  matchingService.Type !==
                    KubernetesApplicationPublishingTypes.NODE_PORT // ignore validation unless the service is of type nodeport
                ) {
                  return true;
                }

                // create a list of all the node ports (number[]) in the cluster, from services that aren't in the application form
                const formServiceNames = formServices.map(
                  (formService) => formService.Name
                );
                const clusterNodePortsWithoutFormServices = nodePortServices
                  .filter(
                    (npService) => !formServiceNames.includes(npService.Name)
                  )
                  .flatMap((npService) => npService.Ports)
                  .map((npServicePorts) => npServicePorts.NodePort);
                // node ports in the current form, excluding the current service
                const formNodePortsWithoutCurrentService = formServices
                  .filter(
                    (formService) =>
                      formService.Type ===
                        KubernetesApplicationPublishingTypes.NODE_PORT &&
                      formService.Name !== matchingService.Name
                  )
                  .flatMap((formService) => formService.Ports)
                  .map((formServicePorts) => formServicePorts.nodePort);
                return (
                  !clusterNodePortsWithoutFormServices.includes(nodePort) && // node port is not in the cluster services that aren't in the application form
                  !formNodePortsWithoutCurrentService.includes(nodePort) // and the node port is not in the current form, excluding the current service
                );
              }
            )
            .test(
              'node-port-minimum',
              'Nodeport number must be inside the range 30000-32767 or blank for system allocated.',
              (nodePort, context) => {
                if (nodePort === undefined || validationData === undefined) {
                  return true;
                }
                const { formServices } = validationData;
                const matchingService = getServiceForPort(
                  context.parent as ServicePort,
                  formServices
                );
                if (
                  !matchingService ||
                  matchingService.Type !==
                    KubernetesApplicationPublishingTypes.NODE_PORT
                ) {
                  return true;
                }
                return nodePort >= 30000;
              }
            )
            .test(
              'node-port-maximum',
              'Nodeport number must be inside the range 30000-32767 or blank for system allocated.',
              (nodePort, context) => {
                if (nodePort === undefined || validationData === undefined) {
                  return true;
                }
                const { formServices } = validationData;
                const matchingService = getServiceForPort(
                  context.parent as ServicePort,
                  formServices
                );
                if (
                  !matchingService ||
                  matchingService.Type !==
                    KubernetesApplicationPublishingTypes.NODE_PORT
                ) {
                  return true;
                }
                return nodePort <= 32767;
              }
            ),
          ingress: object(),
        })
      ),
      Annotations: array(),
    })
  );
}

function getServiceForPort(
  servicePort: ServicePort,
  services: ServiceFormValues[]
) {
  return services.find((service) => service.Name === servicePort.serviceName);
}

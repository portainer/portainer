import { SchemaOf, array, boolean, mixed, number, object, string } from 'yup';
import { useState } from 'react';
import { SingleValue } from 'react-select';
import { List, Plus, Trash2 } from 'lucide-react';
import { FormikErrors } from 'formik';

import DataFlow from '@/assets/ico/dataflow-1.svg?c';
import { KubernetesApplicationPublishingTypes } from '@/kubernetes/models/application/models';
import { useCurrentUser } from '@/react/hooks/useUser';

import { Link } from '@@/Link';
import { TextTip } from '@@/Tip/TextTip';
import { Select } from '@@/form-components/ReactSelect';
import { Button } from '@@/buttons';
import { TooltipWithChildren } from '@@/Tip/TooltipWithChildren';
import { Icon } from '@@/Icon';
import { FormError } from '@@/form-components/FormError';

import { ServiceFormValues, ServicePort, ServiceTypeValue } from './types';
import { LoadBalancerForm } from './LoadBalancerForm';
import { ClusterIpForm } from './ClusterIpForm';
import { NodePortForm } from './NodePortForm';
import { newPort } from './utils';

type ServiceTypeLabel = 'ClusterIP' | 'NodePort' | 'LoadBalancer';
type ServiceTypeOption = { value: ServiceTypeValue; label: ServiceTypeLabel };
const serviceTypeOptions: ServiceTypeOption[] = [
  {
    value: KubernetesApplicationPublishingTypes.CLUSTER_IP,
    label: 'ClusterIP',
  },
  { value: KubernetesApplicationPublishingTypes.NODE_PORT, label: 'NodePort' },
  {
    value: KubernetesApplicationPublishingTypes.LOAD_BALANCER,
    label: 'LoadBalancer',
  },
];

const serviceFormDefaultValues: ServiceFormValues = {
  Headless: false,
  Namespace: '',
  Name: '',
  StackName: '',
  Ports: [],
  Type: 1, // clusterip type as default
  ClusterIP: '',
  ApplicationName: '',
  ApplicationOwner: '',
  Note: '',
  Ingress: false,
  Selector: {},
};

interface Props {
  values: ServiceFormValues[];
  onChange: (loadBalancerPorts: ServiceFormValues[]) => void;
  errors?: FormikErrors<ServiceFormValues[]>;
  loadBalancerEnabled: boolean;
  appName: string;
  selector: Record<string, string>;
}

export function KubeServicesForm({
  values: services,
  onChange,
  errors,
  loadBalancerEnabled,
  appName,
  selector,
}: Props) {
  const { isAdmin } = useCurrentUser();
  const [selectedServiceTypeOption, setSelectedServiceTypeOption] = useState<
    SingleValue<ServiceTypeOption>
  >(serviceTypeOptions[0]); // ClusterIP is the default value

  return (
    <>
      <div className="col-sm-12 form-section-title">
        Publishing the application
      </div>
      <div className="col-sm-12 !p-0">
        <div className="row">
          <TextTip color="blue">
            Publish your application by creating a ClusterIP service for it,
            which you may then expose via{' '}
            <Link
              target="_blank"
              to="kubernetes.ingresses"
              rel="noopener noreferrer"
            >
              an ingress
            </Link>
            .
          </TextTip>
        </div>
      </div>
      <div className="flex w-full">
        <Select<ServiceTypeOption>
          options={serviceTypeOptions}
          value={selectedServiceTypeOption}
          className="w-1/4"
          data-cy="k8sAppCreate-publishingModeDropdown"
          onChange={(val) => {
            setSelectedServiceTypeOption(val);
          }}
        />
        <TooltipWithChildren
          position="top"
          className="portainer-tooltip"
          message="Different service types expose the application in alternate ways.
          ClusterIP exposes it within the cluster (for internal access only).
          NodePort exposes it (on a high port) across all nodes.
          LoadBalancer exposes it via an external load balancer."
        >
          <span>
            <Button
              color="default"
              icon={Plus}
              size="medium"
              disabled={
                selectedServiceTypeOption?.value ===
                  KubernetesApplicationPublishingTypes.LOAD_BALANCER &&
                !loadBalancerEnabled
              }
              onClick={() => {
                // create a new service form value and add it to the list of services
                const newService = structuredClone(serviceFormDefaultValues);
                newService.Name = getUniqName(appName, services);
                newService.Type =
                  selectedServiceTypeOption?.value ||
                  KubernetesApplicationPublishingTypes.CLUSTER_IP;
                const newServicePort = newPort(newService.Name);
                newService.Ports = [newServicePort];
                newService.Selector = selector;
                onChange([...services, newService]);
              }}
              data-cy="k8sAppCreate-createServiceButton"
            >
              Create service
            </Button>
          </span>
        </TooltipWithChildren>
      </div>
      <div className="flex w-full flex-col">
        {selectedServiceTypeOption?.value ===
          KubernetesApplicationPublishingTypes.LOAD_BALANCER &&
          isAdmin &&
          !loadBalancerEnabled && (
            <FormError className="mt-2">
              No Load balancer is available in this cluster, click{' '}
              <Link
                to="kubernetes.cluster.setup"
                target="_blank"
                rel="noopener noreferrer"
              >
                here
              </Link>{' '}
              to configure load balancer.
            </FormError>
          )}
        {selectedServiceTypeOption?.value ===
          KubernetesApplicationPublishingTypes.LOAD_BALANCER &&
          !isAdmin &&
          !loadBalancerEnabled && (
            <FormError className="mt-2">
              No Load balancer is available in this cluster, contact your
              administrator.
            </FormError>
          )}
        {services.map((service, index) => (
          <div key={index} className="border-bottom py-6">
            {service.Type ===
              KubernetesApplicationPublishingTypes.CLUSTER_IP && (
              <>
                <div className="text-muted vertical-center w-full">
                  <Icon icon={List} />
                  ClusterIP
                </div>
                <ClusterIpForm
                  serviceName={service.Name}
                  values={service.Ports}
                  errors={errors?.[index]?.Ports}
                  onChange={(servicePorts: ServicePort[]) => {
                    const newServices = [...services];
                    newServices[index].Ports = servicePorts;
                    onChange(newServices);
                  }}
                />
              </>
            )}
            {service.Type ===
              KubernetesApplicationPublishingTypes.NODE_PORT && (
              <>
                <div className="text-muted vertical-center w-full">
                  <Icon icon={List} />
                  NodePort
                </div>
                <NodePortForm
                  serviceName={service.Name}
                  values={service.Ports}
                  errors={errors?.[index]?.Ports}
                  onChange={(servicePorts: ServicePort[]) => {
                    const newServices = [...services];
                    newServices[index].Ports = servicePorts;
                    onChange(newServices);
                  }}
                />
              </>
            )}
            {service.Type ===
              KubernetesApplicationPublishingTypes.LOAD_BALANCER && (
              <>
                <div className="text-muted vertical-center w-full">
                  <Icon icon={DataFlow} />
                  LoadBalancer
                </div>
                <LoadBalancerForm
                  serviceName={service.Name}
                  values={service.Ports}
                  errors={errors?.[index]?.Ports}
                  onChange={(servicePorts: ServicePort[]) => {
                    const newServices = [...services];
                    newServices[index].Ports = servicePorts;
                    onChange(newServices);
                  }}
                  loadBalancerEnabled={loadBalancerEnabled}
                />
              </>
            )}
            <Button
              icon={Trash2}
              color="danger"
              className="!ml-0 mt-2"
              onClick={() => {
                // remove the service at index in an immutable way
                const newServices = [
                  ...services.slice(0, index),
                  ...services.slice(index + 1),
                ];
                onChange(newServices);
              }}
            >
              Remove
            </Button>
          </div>
        ))}
      </div>
    </>
  );
}

function getUniqName(appName: string, services: ServiceFormValues[]) {
  // services appName will follow thia patten: service, service-2, service-3...
  let nameIndex = 2;
  let UniqName = appName;

  const sortedServices = services.sort((a, b) => {
    if (!a.Name || !b.Name) return 0;
    return a.Name.localeCompare(b.Name);
  });

  if (sortedServices.length !== 0) {
    sortedServices.forEach((service) => {
      if (service.Name === UniqName) {
        UniqName = `${appName}-${nameIndex}`;
        nameIndex += 1;
      }
    });
  }
  return UniqName;
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

export function kubeServicesValidation(): SchemaOf<ServiceFormValues[]> {
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
              // eslint-disable-next-line func-names
              function (servicePort, context) {
                // test for duplicate service ports within this service.
                // yup gives access to context.parent which gives one ServicePort object.
                // yup also gives access to all form values through this.options.context.
                // Unfortunately, it doesn't give direct access to all Ports within the current service.
                // To find all ports in the service for validation, I'm filtering the services by the service name,
                // that's stored in the ServicePort object, then getting all Ports in the service.
                if (servicePort === undefined) {
                  return true;
                }
                const matchingService = getServiceForPort(
                  context.parent as ServicePort,
                  this.options.context?.formValues as ServiceFormValues[]
                );
                if (matchingService === undefined) {
                  return true;
                }
                const servicePorts = matchingService.Ports;
                const duplicateServicePortCount = servicePorts.filter(
                  (port) => port.port === servicePort
                ).length;
                return duplicateServicePortCount === 1;
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
            .required('Node port number is required.')
            .test(
              'node-port-is-unique-in-service',
              'Node port is already used in this service.',
              // eslint-disable-next-line func-names
              function (nodePort, context) {
                if (nodePort === undefined) {
                  return true;
                }
                const matchingService = getServiceForPort(
                  context.parent as ServicePort,
                  this.options.context?.formValues as ServiceFormValues[]
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
                return duplicateNodePortCount === 1;
              }
            )
            .test(
              'node-port-is-unique-in-cluster',
              'Node port is already used.',
              // eslint-disable-next-line func-names
              function (nodePort, context) {
                if (nodePort === undefined) {
                  return true;
                }
                const { nodePortServices } = this.options.context
                  ?.validationContext as NodePortValidationContext;
                const formServices = this.options.context
                  ?.formValues as ServiceFormValues[];
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
                  !formNodePortsWithoutCurrentService.includes(nodePort) // node port is not in the current form, excluding the current service
                );
              }
            )
            .test(
              'node-port-minimum',
              'Nodeport number must be inside the range 30000-32767 or blank for system allocated.',
              // eslint-disable-next-line func-names
              function (nodePort, context) {
                if (nodePort === undefined) {
                  return true;
                }
                const matchingService = getServiceForPort(
                  context.parent as ServicePort,
                  this.options.context?.formValues as ServiceFormValues[]
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
              // eslint-disable-next-line func-names
              function (nodePort, context) {
                if (nodePort === undefined) {
                  return true;
                }
                const matchingService = getServiceForPort(
                  context.parent as ServicePort,
                  this.options.context?.formValues as ServiceFormValues[]
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
    })
  );
}

function getServiceForPort(
  servicePort: ServicePort,
  services: ServiceFormValues[]
) {
  return services.find((service) => service.Name === servicePort.serviceName);
}

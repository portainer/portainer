import { SchemaOf, array, object, boolean, string, mixed, number } from 'yup';

import { KubernetesApplicationPublishingTypes } from '@/kubernetes/models/application/models';

import { ServiceFormValues, ServicePort } from './types';
import { prependWithSlash } from './utils';

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

type AngularIngressPath = {
  IngressName: string;
  Host: string;
  Path: string;
};

type AppServicesValidationData = {
  nodePortServices: ServiceValues[];
  formServices: ServiceFormValues[];
  ingressPaths?: AngularIngressPath[];
  originalIngressPaths?: AngularIngressPath[];
};

export function kubeServicesValidation(
  validationData?: AppServicesValidationData
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
          serviceName: string(),
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
          ingressPaths: array(
            object({
              IngressName: string().required(),
              Host: string().required('Ingress hostname is required.'),
              Path: string()
                .required('Ingress path is required.')
                .test(
                  'path-is-unique',
                  'Ingress path is already in use for this hostname.',
                  (path, context) => {
                    if (
                      path === undefined ||
                      validationData === undefined ||
                      !context.parent.Host
                    ) {
                      return true;
                    }
                    const ingressHostAndPath = `${
                      context.parent.Host
                    }${prependWithSlash(path)}`;
                    const {
                      ingressPaths: ingressPathsInNamespace,
                      formServices,
                      originalIngressPaths,
                    } = validationData;

                    // get the count of the same ingressHostAndPath in the current form values
                    const allFormServicePortIngresses = formServices.flatMap(
                      (service) =>
                        service.Ports.flatMap((port) => port.ingressPaths)
                    );
                    const formMatchingIngressHostPathCount =
                      allFormServicePortIngresses
                        .filter((ingress) => ingress?.Host !== '')
                        .map(
                          (ingress) =>
                            `${ingress?.Host}${prependWithSlash(ingress?.Path)}`
                        )
                        .filter(
                          (formIngressHostAndPath) =>
                            formIngressHostAndPath === ingressHostAndPath
                        ).length;

                    // get the count of the same ingressHostAndPath in the namespace and subtract the count from the original form values
                    const nsMatchingIngressHostPathCount = (
                      ingressPathsInNamespace ?? []
                    )
                      .map(
                        (ingressPath) =>
                          `${ingressPath.Host}${ingressPath.Path}`
                      )
                      .filter(
                        (nsIngressHostAndPath) =>
                          nsIngressHostAndPath === ingressHostAndPath
                      ).length;

                    // get the count of the same ingressHostAndPath in the original form values
                    const originalMatchingIngressHostPathCount = (
                      originalIngressPaths ?? []
                    )
                      .map(
                        (ingressPath) =>
                          `${ingressPath.Host}${ingressPath.Path}`
                      )
                      .filter(
                        (originalIngressHostAndPath) =>
                          originalIngressHostAndPath === ingressHostAndPath
                      ).length;

                    // for the current ingressHostAndPath to be unique, nsMatchingIngressHostPathCount - originalMatchingIngressHostPathCount + formMatchingIngressHostPathCount must be 1 or less.
                    const pathIsUnique =
                      formMatchingIngressHostPathCount === 1 &&
                      nsMatchingIngressHostPathCount -
                        originalMatchingIngressHostPathCount +
                        formMatchingIngressHostPathCount <=
                        1;
                    return pathIsUnique;
                  }
                ),
            })
          ),
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

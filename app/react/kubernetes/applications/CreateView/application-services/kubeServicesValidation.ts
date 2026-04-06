import { SchemaOf, array, object, boolean, string, mixed, number } from 'yup';

import { nanNumberSchema } from '@/react-tools/yup-schemas';
import i18n from '@/i18n';

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
      Type: mixed().oneOf(['ClusterIP', 'NodePort', 'LoadBalancer']),
      ClusterIP: string(),
      ApplicationName: string(),
      ApplicationOwner: string(),
      Note: string(),
      Ingress: boolean().required(),
      Selector: object(),
      Ports: array(
        object({
          port: nanNumberSchema(i18n.t('kubernetes.validation.servicePortRequired') as string)
            .required(i18n.t('kubernetes.validation.servicePortRequired') as string)
            .min(1, i18n.t('kubernetes.validation.servicePortRange') as string)
            .max(65535, i18n.t('kubernetes.validation.servicePortRange') as string)
            .test(
              'service-port-is-unique',
              i18n.t('kubernetes.validation.servicePortUnique') as string,
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
          targetPort: nanNumberSchema(i18n.t('kubernetes.validation.containerPortRequired') as string)
            .required(i18n.t('kubernetes.validation.containerPortRequired') as string)
            .min(1, i18n.t('kubernetes.validation.containerPortRange') as string)
            .max(
              65535,
              i18n.t('kubernetes.validation.containerPortRange') as string
            ),
          name: string(),
          serviceName: string(),
          protocol: string(),
          nodePort: number()
            .test(
              'node-port-is-unique-in-service',
              i18n.t('kubernetes.validation.nodePortUniqueInService') as string,
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
                  matchingService.Type !== 'NodePort'
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
              i18n.t('kubernetes.validation.nodePortUniqueInCluster') as string,
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
                  matchingService.Type !== 'NodePort'
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
                      formService.Type === 'NodePort' &&
                      formService.Name !== matchingService.Name
                  )
                  .flatMap((formService) => formService.Ports)
                  .map((formServicePorts) => formServicePorts.nodePort);
                return (
                  // and the node port is not in the current form, excluding the current service
                  // node port is not in the cluster services that aren't in the application form
                  !clusterNodePortsWithoutFormServices.includes(nodePort) &&
                  !formNodePortsWithoutCurrentService.includes(nodePort)
                );
              }
            )
            .test(
              'node-port-minimum',
              i18n.t('kubernetes.validation.nodePortRange') as string,
              (nodePort, context) => {
                if (nodePort === undefined || validationData === undefined) {
                  return true;
                }
                const { formServices } = validationData;
                const matchingService = getServiceForPort(
                  context.parent as ServicePort,
                  formServices
                );
                if (!matchingService || matchingService.Type !== 'NodePort') {
                  return true;
                }
                return nodePort >= 30000;
              }
            )
            .test(
              'node-port-maximum',
              i18n.t('kubernetes.validation.nodePortRange') as string,
              (nodePort, context) => {
                if (nodePort === undefined || validationData === undefined) {
                  return true;
                }
                const { formServices } = validationData;
                const matchingService = getServiceForPort(
                  context.parent as ServicePort,
                  formServices
                );
                if (!matchingService || matchingService.Type !== 'NodePort') {
                  return true;
                }
                return nodePort <= 32767;
              }
            ),
          ingressPaths: array(
            object({
              IngressName: string().required(),
              Host: string().required(i18n.t('kubernetes.validation.ingressHostnameRequired') as string),
              Path: string()
                .required(i18n.t('kubernetes.validation.ingressPathRequired') as string)
                .test(
                  'path-is-unique',
                  i18n.t('kubernetes.validation.ingressPathUnique') as string,
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

import { compare } from 'fast-json-patch';
import { Service, ServiceSpec } from 'kubernetes-types/core/v1';
import { ObjectMeta } from 'kubernetes-types/meta/v1';

import { Ingress as IngressFormValues } from '@/react/kubernetes/ingresses/types';

import {
  appNameLabel,
  appOwnerLabel,
  appStackNameLabel,
} from '../../constants';

import { ServiceFormValues, ServicePort } from './types';

export function newPort(serviceName?: string): ServicePort {
  return {
    port: 80,
    targetPort: undefined,
    name: '',
    protocol: 'TCP',
    nodePort: undefined,
    serviceName,
  };
}

function generateIndexedName(appName: string, index: number) {
  return index === 0 ? appName : `${appName}-${index}`;
}

function isNameUnique(name: string, services: ServiceFormValues[]) {
  return !services.find((service) => service.Name === name);
}

export function generateUniqueName(
  appName: string,
  index: number,
  services: ServiceFormValues[]
) {
  let initialIndex = index;
  let uniqueName = appName;

  while (!isNameUnique(uniqueName, services)) {
    uniqueName = generateIndexedName(appName, initialIndex);
    initialIndex++;
  }

  return uniqueName;
}

export const serviceFormDefaultValues: ServiceFormValues = {
  Headless: false,
  Namespace: '',
  Name: '',
  StackName: '',
  Ports: [],
  Type: 'ClusterIP',
  ClusterIP: '',
  ApplicationName: '',
  ApplicationOwner: '',
  Note: '',
  Ingress: false,
  Selector: {},
};

/**
 * Generates new Ingress objects from form path data
 * @param {IngressFormValues[]} oldIngresses - The old Ingress objects
 * @param {ServicePort[]} newServicesPorts - The new ServicePort objects from the form
 * @param {ServicePort[]} oldServicesPorts - The old ServicePort objects
 * @returns {IngressFormValues[]} The new Ingress objects
 */
export function generateNewIngressesFromFormPaths(
  oldIngresses?: IngressFormValues[],
  newServicesPorts?: ServicePort[],
  oldServicesPorts?: ServicePort[]
): IngressFormValues[] {
  // filter the ports to only the ones that have an ingress
  const oldIngressPaths = oldServicesPorts
    ?.flatMap((port) => port.ingressPaths)
    .filter((ingressPath) => ingressPath?.IngressName);
  const newPortsWithIngress = newServicesPorts?.filter(
    (port) => port.ingressPaths?.length
  );
  // return early if possible
  if (!oldIngresses && !newPortsWithIngress) {
    return [];
  }

  // remove the old paths from the newIngresses copy
  const newIngresses = structuredClone(oldIngresses) ?? [];
  oldIngressPaths?.forEach((oldIngressPath) => {
    if (!oldIngressPath?.Path) return;
    const newMatchingIng = newIngresses?.find(
      (ingress) => ingress.Name === oldIngressPath.IngressName
    );
    if (!newMatchingIng) return;

    // remove the old path from the new ingress
    const oldPathIndex = newMatchingIng?.Paths?.findIndex(
      (path) =>
        path.Path === prependWithSlash(oldIngressPath.Path) &&
        path.Host === oldIngressPath.Host
    );
    if (oldPathIndex === -1 || oldPathIndex === undefined) return;
    if (newMatchingIng.Paths) {
      newMatchingIng.Paths = [
        ...newMatchingIng.Paths.slice(0, oldPathIndex),
        ...newMatchingIng.Paths.slice(oldPathIndex + 1),
      ];
    }

    // update the new ingresses with the newMatchingIng
    const newIngIndex = newIngresses.findIndex(
      (ingress) => ingress.Name === newMatchingIng.Name
    );
    newIngresses[newIngIndex] = newMatchingIng;
  });

  // and add the new paths to return the updated ingresses
  newPortsWithIngress?.forEach(
    ({ ingressPaths: newIngresspaths, ...servicePort }) => {
      newIngresspaths?.forEach((newIngressPath) => {
        if (!newIngressPath?.Path) return;
        const newMatchingIng = newIngresses.find(
          (ingress) => ingress.Name === newIngressPath?.IngressName
        );
        if (!newMatchingIng) return;

        // add the new path to the new ingress
        if (
          newIngressPath.Host &&
          newIngressPath.IngressName &&
          servicePort.serviceName &&
          servicePort.port
        ) {
          newMatchingIng.Paths = [
            ...(newMatchingIng.Paths ?? []),
            {
              Path: prependWithSlash(newIngressPath.Path),
              Host: newIngressPath.Host,
              IngressName: newIngressPath.IngressName,
              ServiceName: servicePort.serviceName,
              Port: servicePort.port,
              PathType: 'Prefix',
            },
          ];
        }
        // update the new ingresses with the newMatchingIng
        const newIngIndex = newIngresses.findIndex(
          (ingress) => ingress.Name === newMatchingIng.Name
        );
        newIngresses[newIngIndex] = newMatchingIng;
      });
    }
  );
  return newIngresses;
}

/** prependWithSlash puts a '/' in front of a string if there isn't one there already. If the string is empty, it stays empty */
export function prependWithSlash(path?: string) {
  if (!path) return '';
  return path.startsWith('/') ? path : `/${path}`;
}

export function getServicePatchPayload(
  oldService: ServiceFormValues,
  newService: ServiceFormValues
) {
  const oldPayload = getServicePayload(oldService);
  const newPayload = getServicePayload(newService);

  const payload = compare(oldPayload, newPayload);
  return payload;
}

function getServicePayload(service: ServiceFormValues): Service {
  if (!service.Name || !service.Namespace) {
    throw new Error('Service name and namespace are required');
  }

  // metadata
  const labels: Record<string, string> = {};
  if (service.ApplicationName) {
    labels[appNameLabel] = service.ApplicationName;
  }
  if (service.ApplicationOwner) {
    labels[appOwnerLabel] = service.ApplicationOwner;
  }
  if (service.StackName) {
    labels[appStackNameLabel] = service.StackName;
  }
  const metadata: ObjectMeta = {
    name: service.Name,
    namespace: service.Namespace,
    labels,
  };

  // spec
  const ports = service.Headless ? [] : service.Ports;
  const selector = service.Selector;
  const clusterIP = service.Headless ? 'None' : service.ClusterIP;
  const type = service.Headless ? 'ClusterIP' : service.Type;
  const spec: ServiceSpec = {
    ports,
    selector,
    clusterIP,
    type,
  };

  const servicePayload: Service = {
    apiVersion: 'v1',
    kind: 'Service',
    metadata,
    spec,
  };
  return servicePayload;
}

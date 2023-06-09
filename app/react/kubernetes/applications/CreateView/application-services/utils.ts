import { FormikErrors } from 'formik';

import { ServiceFormValues } from './types';

export function isServicePortError<T>(
  error: string | FormikErrors<T> | undefined
): error is FormikErrors<T> {
  return error !== undefined && typeof error !== 'string';
}

export function newPort(serviceName?: string) {
  return {
    port: undefined,
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
  return services.findIndex((service) => service.Name === name) === -1;
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
  Type: 1, // clusterip type as default
  ClusterIP: '',
  ApplicationName: '',
  ApplicationOwner: '',
  Note: '',
  Ingress: false,
  Selector: {},
};

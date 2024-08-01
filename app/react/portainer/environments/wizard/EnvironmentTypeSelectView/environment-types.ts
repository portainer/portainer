import { compact } from 'lodash';

import { FeatureId } from '@/react/portainer/feature-flags/enums';
import Docker from '@/assets/ico/vendor/docker.svg?c';
import Podman from '@/assets/ico/vendor/podman.svg?c';
import Kubernetes from '@/assets/ico/vendor/kubernetes.svg?c';
import Azure from '@/assets/ico/vendor/azure.svg?c';
import KaaS from '@/assets/ico/vendor/kaas-icon.svg?c';
import InstallK8s from '@/assets/ico/vendor/install-kubernetes.svg?c';

import { BoxSelectorOption } from '@@/BoxSelector';

export type EnvironmentOptionValue =
  | 'dockerStandalone'
  | 'dockerSwarm'
  | 'podman'
  | 'kubernetes'
  | 'aci'
  | 'kaas'
  | 'k8sInstall';

export interface EnvironmentOption
  extends BoxSelectorOption<EnvironmentOptionValue> {
  id: EnvironmentOptionValue;
  value: EnvironmentOptionValue;
}
export function getExistingEnvironmentTypes(
  isPodmanEnabled: boolean
): EnvironmentOption[] {
  const options: (EnvironmentOption | false)[] = [
    {
      id: 'dockerStandalone',
      value: 'dockerStandalone',
      label: 'Docker Standalone',
      icon: Docker,
      iconType: 'logo',
      description: 'Connect to Docker Standalone via URL/IP, API or Socket',
    },
    {
      id: 'dockerSwarm',
      value: 'dockerSwarm',
      label: 'Docker Swarm',
      icon: Docker,
      iconType: 'logo',
      description: 'Connect to Docker Swarm via URL/IP, API or Socket',
    },
    isPodmanEnabled && {
      id: 'podman',
      value: 'podman',
      label: 'Podman',
      icon: Podman,
      iconType: 'logo',
      description: 'Connect to Podman via URL/IP, API or Socket',
    },
    {
      id: 'kubernetes',
      value: 'kubernetes',
      label: 'Kubernetes',
      icon: Kubernetes,
      iconType: 'logo',
      description: 'Connect to a Kubernetes environment via URL/IP',
    },
    {
      id: 'aci',
      value: 'aci',
      label: 'ACI',
      description: 'Connect to ACI environment via API',
      iconType: 'logo',
      icon: Azure,
    },
  ];
  return compact(options);
}

export const newEnvironmentTypes: EnvironmentOption[] = [
  {
    id: 'kaas',
    value: 'kaas',
    label: 'Provision KaaS Cluster',
    description:
      "Provision a Kubernetes cluster via a cloud provider's Kubernetes as a Service",
    icon: KaaS,
    iconType: 'logo',
    feature: FeatureId.KAAS_PROVISIONING,
    disabledWhenLimited: true,
  },
  {
    id: 'k8sInstall',
    value: 'k8sInstall',
    label: 'Create Kubernetes cluster',
    description: 'Create a Kubernetes cluster on existing infrastructure',
    icon: InstallK8s,
    iconType: 'logo',
    feature: FeatureId.K8SINSTALL,
    disabledWhenLimited: true,
  },
];

export function getEnvironmentTypes(isPodmanEnabled: boolean) {
  return [
    ...getExistingEnvironmentTypes(isPodmanEnabled),
    ...newEnvironmentTypes,
  ];
}

export const formTitles: Record<EnvironmentOptionValue, string> = {
  dockerStandalone: 'Connect to your Docker Standalone environment',
  dockerSwarm: 'Connect to your Docker Swarm environment',
  podman: 'Connect to your Podman environment',
  kubernetes: 'Connect to your Kubernetes environment',
  aci: 'Connect to your ACI environment',
  kaas: 'Provision a KaaS environment',
  k8sInstall: 'Create a Kubernetes cluster',
};
